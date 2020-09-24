const fs = require('fs');
const Papa = require('papaparse');
const _ = require('lodash');
const { DateTime } = require('luxon');

const { strip } = require('./lib/helpers');

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
  if (metadata[id].channel_name !== '') {
    return metadata[id].channel_name;
  } else {
    return metadata[id].nom_compteur;
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

  const now = DateTime.local().set({ hour: 0, minute: 0, second: 0 });
  const oneDay = now.minus({ day: 2 }).toISO();
  const oneMonth = now.minus({ month: 1 }).toISO();
  return {
    name: ids[0],
    img: '',
    week: sorted.filter((d) => d.time >= oneDay),
    month: sorted.filter((d) => d.time >= oneMonth),
    year: sorted,
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
