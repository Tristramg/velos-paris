import Head from 'next/head'
import _ from 'lodash'
import moment from 'moment'

import {
  counts,
  metadatas,
  CounterSummary,
  CounterMetadata,
} from '../data/read_data'

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
    <div className="border rounded-lg p-2 shadow-xl">
      <h2>{stat.label}</h2>
      <dl className="pt-2">
        <dt>Hier</dt>
        <dd>
          <Num n={stat.yesterday} />
        </dd>
        <dt>Derniers 7 jours </dt>
        <dd>
          <Num n={stat.lastWeek} />
        </dd>
        <dt>Dernier 30 jours </dt>
        <dd>
          <Num n={stat.last30Days} />
        </dd>
        <dt>Moyenne</dt>
        <dd>
          <Num n={stat.average} /> (sur {stat.days} jours)
        </dd>
      </dl>
    </div>
  )
}

type CounterStat = {
  id: string
  label: string
  days: number
  yesterday: number
  lastWeek: number
  last30Days: number
  average: number
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
    days,
    average: Math.round(counter.total / days),
    yesterday: counter.lastDay,
    last30Days: counter.lastMonth,
    lastWeek: counter.lastWeek,
  }
}

export default function Home({ counts, metadata }: Props) {
  const stats = _(counts)
    .map(transform(metadata))
    .sortBy('yesterday')
    .reverse()
    .toArray()
    .value()
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Hello</h1>
      <div className="grid grid-cols-4 gap-4">
        {_.map(stats, (stat) => (
          <Counter key={stat.id} stat={stat} />
        ))}
      </div>
    </div>
  )
}
