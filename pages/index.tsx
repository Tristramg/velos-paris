import Head from 'next/head';
import _ from 'lodash';
import { CounterSummary, CounterMetadata, CounterStat } from '../lib/types.d';
import { useState } from 'react';
import { DateTime } from 'luxon';

import Counter from '../components/counter_tile';
import Map from '../components/map';
import { counts, metadatas, buildTime } from '../data/read_data';
import { prepareStats } from '../lib/helpers';

export const getStaticProps = async () => ({
  props: {
    counts: await counts(),
    metadata: await metadatas(),
    buildTime: await buildTime(),
  },
});

type Props = {
  counts: {
    [id: string]: CounterSummary;
  };
  metadata: {
    [id: string]: CounterMetadata;
  };
  buildTime: DateTime;
};

export default function AllCounters({ counts, metadata, buildTime }: Props) {
  const [highlight, setHighlight] = useState(null);
  const [avg, setAvg] = useState(false);
  const [stats, setStats] = useState(prepareStats(counts, metadata));

  return (
    <>
      <Head>
        <title>Compteurs vélo à Paris</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Compteurs vélo à Paris</h1>
      <div className="flex">
        <div className="w-1/2">
          <h2>Paramètres</h2>
          <p>
            Indiquer la moyenne journalière{' '}
            <input type="checkbox" onClick={() => setAvg(!avg)} />
          </p>
          <div>
            Trier par :
            <div className="inline-block relative ml-2">
              <select
                className="block appearance-none border border-gray-400 hover:border-gray-500 px-1 py-1 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                name="order"
                id="order"
                onChange={(e) =>
                  setStats(_.sortBy(stats, e.target.value).reverse())
                }
              >
                <option value="day">Hier</option>
                <option value="week">7 jours</option>
                <option value="month">30 jours</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="pb-12 text-sm w-1/2">
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
          <p>Page générée le {buildTime}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Map counters={stats} highlight={highlight} />
        {_.map(stats, (stat) => (
          <div
            className="border rounded-lg p-4 shadow-lg bg-white"
            onClick={() => setHighlight(stat.id)}
            key={stat.id}
          >
            <Counter stat={stat} avg={avg} />
          </div>
        ))}
      </div>
    </>
  );
}
