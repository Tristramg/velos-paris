const fs = require('fs');
const Papa = require('papaparse');
const _ = require('lodash');
const { DateTime } = require('luxon');

const strip = (name) => {
  const num = /^\d+/;
  const direction = /[NESO]+-[NESO]+$/g;
  return fix(name)
    .replace(num, '')
    .replace(direction, '')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
};

const fix = (name) => {
  return name
    .replace('Totem ', '')
    .replace('Face au ', '')
    .replace('Face ', '')
    .replace('90 Rue De Sèvres 90 Rue De Sèvres  Vélos', 'Rue de Sèvres')
    .replace('Menilmontant', 'Ménilmontant')
    .replace("'", '’')
    .replace('D’', 'd’')
    .trim();
};

function metadatas() {
  const file = fs.createReadStream('./public/metadata.csv');
  Papa.parse(file, {
    delimiter: ';',
    header: true,
    complete: ({ data, errors }) => {
      if (errors.length > 0) {
        console.error('While parsing metadata', errors);
      } else {
        const result = _(data)
          .map((r) => [r.id_compteur, r])
          .fromPairs()
          .value();
        readCSV(result);
      }
    },
  });
}

function readCSV(metadata) {
  console.log('Start parsing everything');
  const result = [];
  const file = fs.createReadStream('./public/compteurs.csv');
  Papa.parse(file, {
    delimiter: ';',
    header: true,
    step: ({ data, errors }) => {
      if (errors.length > 0) {
        console.error(errors);
      } else {
        const id = data['id_compteur'];

        result.push({
          time: data['date'],
          count: Number(data['sum_counts']),
          id,
        });
      }
    },
    complete: () => {
      save(result, metadata);
    },
  });
}

const relevantIds = (metadata, counterId) =>
  _(metadata)
    .toArray()
    .filter((counter) => strip(counter.name) === counterId)
    .map('id_compteur')
    .value();

const channelName = (id, metadata) => {
  if (
    metadata[id].channel_name !== '' &&
    metadata[id].channel_name != metadata[id].nom_compteur
  ) {
    return metadata[id].channel_name;
  } else {
    const striped = strip(metadata[id].nom_compteur);
    return fix(metadata[id].nom_compteur).replace(striped, '');
  }
};

const prepare = (ids, details, metadata) => {
  const sorted = _(details)
    .filter((d) => ids.includes(d.id))
    .map(({ count, time, id }) => ({
      count,
      time,
      id: channelName(id, metadata),
    }))
    .sort((a, b) => (a.time < b.time ? -1 : 1))
    .value();

  const groupByFormat = (format) => (data) =>
    _(data)
      .groupBy((d) => DateTime.fromISO(d.time).set(format))
      .map((values, time) => ({
        time,
        count: _.sumBy(values, 'count'),
      }))
      .value();

  const group = (data, format) =>
    _(data)
      .groupBy('id')
      .mapValues(groupByFormat(format))
      .flatMap((values, id) =>
        values.map(({ time, count }) => ({ time, count, id }))
      )
      .value();
  const now = DateTime.local().set({ hour: 0, minute: 0, second: 0 });
  const oneDay = now.minus({ day: 3 }).toISO();
  const oneMonth = now.minus({ month: 1 }).toISO();

  return {
    name: ids[0],
    img: '',
    day: sorted.filter((d) => d.time >= oneDay),
    month: group(
      sorted.filter((d) => d.time >= oneMonth),
      { hour: 0, minute: 0, second: 0 }
    ),
    year: group(sorted, { hour: 0, minute: 0, second: 0, weekday: 1 }),
  };
};

async function save(data, metadata) {
  const grouped = _(metadata)
    .values()
    .groupBy((m) => strip(m.nom_compteur))
    .value();

  for (const counter in grouped) {
    const ids = relevantIds(metadata, counter);
    const prepared = prepare(ids, data, metadata);
    fs.writeFile(
      `public/data/${counter}.json`,
      JSON.stringify(prepared),
      () => {
        console.log('Finished', counter);
      }
    );
  }
}

metadatas();
