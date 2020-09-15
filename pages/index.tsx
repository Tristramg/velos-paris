import Head from 'next/head'
import _ from 'lodash'
import moment from 'moment'
import Map from '../components/map'
import Counter from '../components/counter_tile'

import {
  counts,
  metadatas,
  CounterSummary,
  CounterMetadata,
} from '../data/read_data'
import { useState } from 'react'

export const getStaticProps = async () => ({
  props: {
    counts: await counts(),
    metadata: await metadatas(),
  },
})

type Props = {
  counts: {
    [id: string]: CounterSummary
  }
  metadata: {
    [id: string]: CounterMetadata
  }
}

const Num = ({ n }: { n: number }) => (
  <span className="font-mono">{n.toLocaleString('fr-FR')}</span>
)

function Counter({ stat }: { stat: CounterStat }) {
  return (
    <>
      <h2>{stat.label}</h2>
      <dl className="pt-2">
        <dt>Hier</dt>
        <dd>
          <Num n={stat.yesterday} />
        </dd>
        <dt>Sur 7 jours </dt>
        <dd>
          <Num n={stat.lastWeek} />
        </dd>
        <dt>Sur 30 jours </dt>
        <dd>
          <Num n={stat.last30Days} />
        </dd>
        <dt>Moyenne</dt>
        <dd>
          (sur {stat.days} jours) <Num n={stat.average} />
        </dd>
        <dt>Compteurs</dt>
        <dd>
          <ul className="text-xs">
            {stat.included.map((counter) => (
              <li key={counter}>{counter}</li>
            ))}
          </ul>
        </dd>
      </dl>
    </>
  )
}

export type CounterStat = {
  id: string
  label: string
  strippedLabel: string
  days: number
  yesterday: number
  lastWeek: number
  last30Days: number
  average: number
  included: string[]
  coordinates: [number, number]
}

const parseCoord = (coord: string): [number, number] => {
  const parts = coord.split(',')
  return [Number(parts[1]), Number(parts[0])]
}

const transform = (metadatas: { [id: string]: CounterMetadata }) => (
  counter: CounterSummary,
  id: string,
): CounterStat => {
  const metadata = metadatas[id]
  const minDate = moment(counter.minDate)
  const maxDate = moment(counter.maxDate)

  const days = maxDate.diff(minDate, 'day')
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
  const direction = /[NESO]+-[NESO]+$/
  return name
    .replace(num, '')
    .replace(direction, '')
    .replace('Menilmontant', 'Ménilmontant') // sorry
    .trim()
}

export default function AllCounters({ counts, metadata }: Props) {
  const [highlight, setHighlight] = useState(null)
  const stats = _(counts)
    .map(transform(metadata))
    .groupBy('strippedLabel')
    .map(merge)
    .sortBy('yesterday')
    .reverse()
    .toArray()
    .value()
  return (
    <div className="font-sans px-4 py-1 bg-gray-200">
      <Head>
        <title>Compteurs vélo à Paris</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Compteurs vélo à Paris</h1>
      <div className="pb-12 text-sm">
        <p>Nombre de passages de vélo sur les points de mesure</p>
        <p>
          Source :{' '}
          <a href="https://parisdata.opendatasoft.com/explore/dataset/comptage-velo-donnees-compteurs/information/">
            données ouvertes de la ville de Paris
          </a>
        </p>
        <p>
          Données sous licence{' '}
          <a href="https://opendatacommons.org/licenses/odbl/">ODbL</a>
        </p>
        <p>
          <a href="https://github.com/Tristramg/velos-paris">
            Code source de la page
          </a>{' '}
          sous licence MIT
        </p>
      </div>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Map counters={stats} highlight={highlight} />
        {_.map(stats, (stat) => (
          <div
            className="border rounded-lg p-4 shadow-lg bg-white"
            onClick={() => setHighlight(stat.id)}
            key={stat.id}
          >
            <Counter stat={stat} />
          </div>
        ))}
      </div>
    </div>
  )
}
