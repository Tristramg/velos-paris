const fs = require('fs');
const Papa = require('papaparse');
const _ = require('lodash');
const { DateTime } = require('luxon');
const slugify = require('slugify');

const strip = (name) => {
  const num = /^\d+/;
  const direction = /[NESO]+-[NESO]+/g;
  return fix(name)
    .replace(num, '')
    .replace(direction, '')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
};

const dedup = (name) => {
  const first = name.substr(0, name.length / 2).trim();
  const second = name.substr(name.length / 2, name.length).trim();
  if (first === second) {
    return first;
  } else {
    return name;
  }
};

const fix = (name) => {
  const fixed = name
    .replace('Totem ', '')
    .replace('Face au ', '')
    .replace('Face ', '')
    .replace('Menilmontant', 'Ménilmontant')
    .replace('8 boulevard d\'Indochine 8 boulevard d\'Indochine', 'Boulevard d’Indochine')
    .replace('(prêt)', '')
    .replace('Logger_IN', '')
    .replace('Logger_OUT', '')
    .replace('[Bike IN]', '')
    .replace('[Bike OUT]', '')
    .replace('Piétons IN', '')
    .replace('Piétons OUT', '')
    .replace('IN', '')
    .replace('OUT', '')
    .replace('[Bike]', '')
    .replace('[Velos]', '')
    .replace('porte', 'Porte')
    .replace('Vélos', '')
    .replace("'", '’')
    .replace('D’', 'd’')
    .replace(/  /g, ' ')
    .replace(/#./, '')
    .trim();

  return dedup(fixed);
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

const parseCoord = (coord) => {
  const parts = coord.split(',');
  return [Number(parts[1]), Number(parts[0])];
};

const prepare = (ids, details, metadata, counter) => {
  const sorted = _(details)
    .filter((d) => ids.includes(d.id))
    .map(({ count, time, id }) => ({
      count,
      time,
      id: channelName(id, metadata),
    }))
    .sort((a, b) => (a.time < b.time ? -1 : 1))
    .value();

  const groupByDateFormat = (format) => (data) =>
    _(data)
      .groupBy((d) => DateTime.fromISO(d.time).set(format))
      .map((values, time) => ({
        time,
        count: _.sumBy(values, 'count'),
      }))
      .value();

  const group = (data, format, filter) =>
    _(data)
      .filter((d) => filter === null || d.time >= filter)
      .groupBy('id')
      .mapValues(groupByDateFormat(format))
      .flatMap((values, id) =>
        values.map(({ time, count }) => ({ time, count, id }))
      )
      .value();

  const dayFmt = { hour: 0, minute: 0, second: 0 };
  const weekFmt = { hour: 0, minute: 0, second: 0, weekday: 1 };
  const record = (data, format) =>
    _.maxBy(groupByDateFormat(format)(data), 'count') || {
      time: now,
      count: 0,
    };
  const now = DateTime.local().set(dayFmt);
  const oneDay = now.minus({ day: 2 }).toISO();
  const oneMonth = now.minus({ month: 1 }).toISO();
  const oneYear = now.minus({ year: 1 }).toISO();

  return {
    title: counter,
    details: ids.map((id) => ({
      name: metadata[id].nom_compteur,
      img: metadata[id].url_photos_n1,
      date: metadata[id].installation_date,
      coord: parseCoord(metadata[id].coordinates),
    })),
    day: sorted.filter((d) => d.time >= oneDay),
    hour_record: record(sorted, { minute: 0, second: 0 }),
    day_record: record(sorted, dayFmt),
    week_record: record(sorted, weekFmt),
    month: group(sorted, dayFmt, oneMonth),
    year: group(sorted, weekFmt, null),
    year_daily: group(sorted, dayFmt, oneYear),
  };
};

async function save(data, metadata) {
  const grouped = _(metadata)
    .values()
    .groupBy((m) => strip(m.nom_compteur))
    .value();

  for (const counter in grouped) {
    const ids = relevantIds(metadata, counter);
    const prepared = prepare(ids, data, metadata, counter);
    const filename = `public/data/${slugify(counter)}.json`;
    fs.writeFile(filename, JSON.stringify(prepared), (error) => {
      if (error) {
        console.error(`Error preparing ${counter} in ${filename}`, error);
        return;
      }
      console.log(`Finished preparing ${counter} in ${filename}`);
    });
  }
}

metadatas();
