import Head from 'next/head'
import _ from 'lodash'
import moment from 'moment'
import { CounterSummary, CounterMetadata, CounterStat } from '../lib/types.d'
import { useState } from 'react'

import Counter from '../components/counter_tile'
import Map from '../components/map'
import { counts, metadatas } from '../data/read_data'
import { prepareStats } from '../lib/helpers'

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

export default function AllCounters({ counts, metadata }: Props) {
  const [highlight, setHighlight] = useState(null)
  const stats = prepareStats(counts, metadata)

  return (
    <>
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
          </a>{' '}
          <a href="/compteurs.csv">(données en cache)</a>
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
    </>
  )
}
