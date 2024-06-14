import _ from 'lodash';
import { CounterMetadata, CounterSummary, CounterStat } from './types';

export const parseCoord = (coord: string): [number, number] => {
  const parts = coord.split(',');
  return [Number(parts[1]), Number(parts[0])];
};

const transform =
  (metadatas: { [id: string]: CounterMetadata }) =>
  (counter: CounterSummary, id: string): CounterStat => {
    const metadata = metadatas[id];
    const minDate = counter.minDate;
    const maxDate = counter.maxDate;

    const days = Math.round(maxDate.diff(minDate, 'day').days);
    return {
      id,
      label: metadata.nom_compteur,
      strippedLabel: strip(metadata.nom_compteur),
      days,
      total: counter.total,
      day: counter.day,
      month: counter.month,
      week: counter.week,
      year: counter.year,
      daysThisYear: counter.daysThisYear,
      included: [],
      coordinates: parseCoord(metadata.coordinates),
    };
  };

const merge = (counters: CounterStat[], id: string): CounterStat => ({
  id,
  label: id,
  strippedLabel: id,
  days: _.sumBy(counters, 'days') / counters.length,
  total: _.sumBy(counters, 'total'),
  day: _.sumBy(counters, 'day'),
  month: _.sumBy(counters, 'month'),
  week: _.sumBy(counters, 'week'),
  year: _.sumBy(counters, 'year'),
  daysThisYear: counters[0].daysThisYear,
  included: _.map(counters, 'label'),
  coordinates: counters[0].coordinates,
});

export const strip = (name: string): string => {
  const result = name
    .replaceAll(/[NESO]+-[NESO]+/g, '')
    .replaceAll('Face au ', '')
    .replaceAll('Face ', '')
    .replaceAll('En face du', '')
    .replaceAll('Menilmontant', 'Ménilmontant')
    .replaceAll('Quay', 'Quai')
    .replaceAll('(prêt)', '')
    .replaceAll('Logger_IN', '')
    .replaceAll('Logger_OUT', '')
    .replaceAll('[Bike IN]', '')
    .replaceAll('[Bike OUT]', '')
    .replaceAll('Piétons IN', '')
    .replaceAll('Piétons OUT', '')
    .replace(/\[Pedestrian.*\]/, '')
    .replace(/Direction.*Centre de Paris/, '')
    .replaceAll('Pedestrian', '')
    .replaceAll('(temporaire)', '')
    .replaceAll('IN', '')
    .replaceAll('OUT', '')
    .replaceAll('[Bike]', '')
    .replaceAll('[Velos]', '')
    .replaceAll('Vélos', '')
    .replaceAll("'", '’')
    .replaceAll('D’', 'd’')
    .replaceAll(/  /g, ' ')
    .replace(/#./, '')
    .replaceAll('Totem ', '')
    .trim()
    .replace(/^(?<name>.+) \k<name>$/i, '$1')
    .replace(/^\d+/, '')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
  console.log(`${name}>${result}`);
  return result;
};

export const prepareStats = (
  counts: { [id: string]: CounterSummary },
  metadata: { [id: string]: CounterMetadata }
): CounterStat[] =>
  _(counts)
    .map(transform(metadata))
    .groupBy('strippedLabel')
    .map(merge)
    .sortBy('day')
    .reverse()
    .toArray()
    .value();
