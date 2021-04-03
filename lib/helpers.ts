import { DateTime } from 'luxon';
import _ from 'lodash';
import { CounterMetadata, CounterSummary, CounterStat } from './types';

const parseCoord = (coord: string): [number, number] => {
  const parts = coord.split(',');
  return [Number(parts[1]), Number(parts[0])];
};

const transform = (metadatas: { [id: string]: CounterMetadata }) => (
  counter: CounterSummary,
  id: string
): CounterStat => {
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
  days: _.sumBy(counters, 'days'),
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
  const num = /^\d+/;
  const direction = /[NESO]+-[NESO]+$/g;
  return name
    .replace('Totem ', '')
    .replace('Face au ', '')
    .replace('Face ', '')
    .replace('90 Rue De Sèvres 90 Rue De Sèvres  Vélos', 'Rue de Sèvres')
    .replace('(prêt)', '')
    .replace('Logger_IN', '')
    .replace('Logger_OUT', '')
    .replace('Menilmontant', 'Ménilmontant')
    .replace('[Bike IN]', '')
    .replace('[Bike OUT]', '')
    .replace('[Bike]', '')
    .replace('[Velos]', '')
    .replace('porte', 'Porte')
    .replace(
      '254 Rue de Vaugirard 254 Rue de Vaugirard',
      '254 Rue de Vaugirard'
    )
    .replace(
      '152 boulevard du Montparnasse 152 boulevard du Montparnasse',
      '152 boulevard du Montparnasse'
    )
    .replace(
      '100 rue La Fayette O-E 100 rue La Fayette O-E',
      '100 rue La Fayette O-E'
    )
    .replace(
      '97 avenue Denfert Rochereau SO-NE 97 avenue Denfert Rochereau SO-NE',
      '97 avenue Denfert Rochereau SO-NE'
    )
    .trim()
    .replace(num, '')
    .replace(direction, '')
    .replace("'", '’')
    .replace('D’', 'd’')
    .replace(/  /g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
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
