import { DateTime } from 'luxon'
import _ from 'lodash'
import { CounterMetadata, CounterSummary, CounterStat } from './types'

const parseCoord = (coord: string): [number, number] => {
  const parts = coord.split(',')
  return [Number(parts[1]), Number(parts[0])]
}

const transform = (metadatas: { [id: string]: CounterMetadata }) => (
  counter: CounterSummary,
  id: string,
): CounterStat => {
  const metadata = metadatas[id]
  const minDate = DateTime.fromISO(counter.minDate)
  const maxDate = DateTime.fromISO(counter.maxDate)

  const days = Math.round(maxDate.diff(minDate, 'day').days)
  return {
    id,
    label: metadata.nom_compteur,
    strippedLabel: strip(metadata.nom_compteur),
    days,
    average: Math.round(counter.total / days),
    yesterday: counter.lastDay,
    last30Days: counter.lastMonth,
    lastWeek: counter.lastWeek,
    included: [],
    coordinates: parseCoord(metadata.coordinates),
  }
}

const merge = (counters: CounterStat[], id: string): CounterStat => ({
  id,
  label: id,
  strippedLabel: id,
  days: _.sumBy(counters, 'days'),
  average: _.sumBy(counters, 'average'),
  yesterday: _.sumBy(counters, 'yesterday'),
  last30Days: _.sumBy(counters, 'last30Days'),
  lastWeek: _.sumBy(counters, 'lastWeek'),
  included: _.map(counters, 'label'),
  coordinates: counters[0].coordinates,
})

const strip = (name: string): string => {
  const num = /^\d+/
  const direction = /[NESO]+-[NESO]+$/g
  return name
    .replace('Totem ', '')
    .replace('Face au ', '')
    .replace('Face ', '')
    .replace('90 Rue De Sèvres 90 Rue De Sèvres  Vélos', 'Rue de Sèvres')
    .replace(num, '')
    .replace(direction, '')
    .replace('Menilmontant', 'Ménilmontant') // sorry
    .replace("'", '’')
    .replace('D’', 'd’')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

export const prepareStats = (
  counts: { [id: string]: CounterSummary },
  metadata: { [id: string]: CounterMetadata },
): CounterStat[] =>
  _(counts)
    .map(transform(metadata))
    .groupBy('strippedLabel')
    .map(merge)
    .sortBy('yesterday')
    .reverse()
    .toArray()
    .value()
