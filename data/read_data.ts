import Papa from 'papaparse';
import fs from 'fs';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { CounterSummary, CounterMetadata } from '../lib/types';

const defaultCounter = (daysThisYear: number): CounterSummary => ({
  total: 0,
  day: 0,
  week: 0,
  month: 0,
  year: 0,
  daysThisYear,
  minDate: DateTime.min(), //'9999-12-31T23:59:59',
  maxDate: DateTime.max(), //'0000-01-01T00:00:00',
});

// https://parisdata.opendatasoft.com/api/v2/catalog/datasets/comptage-velo-compteurs/exports/csv'
export function metadatas(): Promise<{ [id: string]: CounterMetadata }> {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream('./public/metadata.csv');
    Papa.parse<CounterMetadata>(file, {
      delimiter: ';',
      header: true,
      complete: ({ data, errors }) => {
        if (errors.length > 0) {
          console.error('While parsing metadata', errors);
          reject(errors);
        } else {
          const result = _(data)
            .map((r) => [r.id_compteur, r])
            .fromPairs()
            .value();
          resolve(result);
        }
      },
    });
  });
}

export async function buildTime(): Promise<string> {
  return DateTime.local().toFormat('dd/LL/yyyy à HH:mm');
}

// 'https://parisdata.opendatasoft.com/api/v2/catalog/datasets/comptage-velo-donnees-compteurs/exports/csv?rows=-1&select=id_compteur%2Csum_counts%2Cdate&timezone=UTC'
export async function counts(): Promise<{
  [id: string]: CounterSummary;
}> {
  return new Promise((resolve, reject) => {
    const counters: { [id: string]: CounterSummary } = {};

    const file = fs.createReadStream('./public/compteurs.csv');

    const now = DateTime.local().set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const oneDay = now.minus({ day: 1 });
    const oneWeek = now.minus({ week: 1 });
    const oneMonth = now.minus({ month: 1 });
    const thisYear = now.set({ month: 1, day: 1 });

    const daysThisYear = now.diff(now.set({ month: 1, day: 1 })).as('day');

    Papa.parse(file, {
      delimiter: ';',
      header: true,
      step: ({ data, errors }) => {
        if (data['id_compteur'] === '') {
          // skip empty values
        } else if (errors.length > 0) {
          console.error(errors);
          reject(errors);
        } else {
          const id = data['id_compteur'];
          const count = Number(data['sum_counts']);

          if (counters[id] === undefined) {
            counters[id] = defaultCounter(daysThisYear);
          }

          const date = DateTime.fromISO(data['date']);

          counters[id].minDate = _.min([counters[id].minDate, date]);
          counters[id].maxDate = _.max([counters[id].minDate, date]);

          counters[id].total += count;

          if (date >= thisYear) {
            counters[id].year += count;
          }

          if (date >= oneMonth) {
            counters[id].month += count;
            if (date >= oneWeek) {
              counters[id].week += count;
              if (date >= oneDay) {
                counters[id].day += count;
              }
            }
          }
        }
      },
      complete: () => resolve(counters),
      error: reject,
    });
  });
}
