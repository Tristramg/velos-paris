import Papa from 'papaparse'
import fs from 'fs'
import _ from 'lodash'
import moment from 'moment'

export type CounterSummary = {
  total: number
  lastDay: number
  lastWeek: number
  lastMonth: number
  minDate: string
  maxDate: string
}

export type CounterMetadata = {
  id_compteur: string
  nom_compteur: string
  id: string
  name: string
  channel_id: string
  channel_name: string
  installation_date: string
  url_photos_n1: string
  coordinates: string
}
const defaultCounter = (): CounterSummary => ({
  total: 0,
  lastDay: 0,
  lastWeek: 0,
  lastMonth: 0,
  minDate: '9999-12-31T23:59:59',
  maxDate: '0000-01-01T00:00:00',
})

// https://parisdata.opendatasoft.com/api/v2/catalog/datasets/comptage-velo-compteurs/exports/csv'
export function metadatas(): Promise<{ [id: string]: CounterMetadata }> {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream('./public/metadata.csv')
    Papa.parse<CounterMetadata>(file, {
      delimiter: ';',
      header: true,
      complete: ({ data, errors }) => {
        if (errors.length > 0) {
          console.error('While parsing metadata', errors)
          reject(errors)
        } else {
          const result = _(data)
            .map((r) => [r.id_compteur, r])
            .fromPairs()
            .value()
          resolve(result)
        }
      },
    })
  })
}

type RawCount = {
  id_compteur: string
  sum_counts: string
  date: string
}

// 'https://parisdata.opendatasoft.com/api/v2/catalog/datasets/comptage-velo-donnees-compteurs/exports/csv?rows=-1&select=id_compteur%2Csum_counts%2Cdate&timezone=UTC'
export async function counts(): Promise<{
  [id: string]: CounterSummary
}> {
  return new Promise((resolve, reject) => {
    const counters: { [id: string]: CounterSummary } = {}

    const file = fs.createReadStream('./public/compteurs.csv')

    const now = moment().hours(0).minutes(0).seconds(0)
    const oneDay = now.clone().subtract(1, 'day').toISOString()
    const oneWeek = now.clone().subtract(1, 'week').toISOString()
    const oneMonth = now.clone().subtract(1, 'month').toISOString()

    Papa.parse<RawCount>(file, {
      delimiter: ';',
      header: true,
      step: ({ data, errors }) => {
        if (errors.length > 0) {
          console.error(errors)
          reject(errors)
        } else {
          const id = data['id_compteur']
          const count = Number(data['sum_counts'])

          if (counters[id] === undefined) {
            counters[id] = defaultCounter()
          }

          const date = data['date']

          counters[id].minDate = _.min([counters[id].minDate, date])
          counters[id].maxDate = _.max([counters[id].minDate, date])

          counters[id].total += count

          if (date >= oneMonth) {
            counters[id].lastMonth += count
            if (date >= oneWeek) {
              counters[id].lastWeek += count
              if (date >= oneDay) {
                counters[id].lastDay += count
              }
            }
          }
        }
      },
      complete: () => resolve(counters),
      error: reject,
    })
  })
}
