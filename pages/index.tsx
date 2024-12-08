import Head from 'next/head';
import Link from 'next/link';
import { CounterStat } from '../lib/types.d';
import { useState } from 'react';
import _ from 'lodash';

import Counter from '../components/counter_tile';
import Map from '../components/map';
import { Metadata } from 'next';
import { DuckDBInstance, DuckDBListValue } from '@duckdb/node-api';
import { DateTime } from 'luxon';

type Props = {
  counts: CounterStat[];
  buildTime: string;
};

type StaticProps = {
  props: Props;
};

export const getStaticProps = async (): Promise<StaticProps> => {
  const instance = await DuckDBInstance.create('compteurs.duckdb', { access_mode: 'READ_ONLY' });
  const connection = await instance.connect();

  const metadata = await connection.run('SELECT name, slug, longitude, latitude, yesterday, week, month, year, total, days, days_this_year, single_counters FROM counter_group ORDER BY yesterday DESC')
  const rows = await metadata.getRows();
  const counts = rows.map(row => {
    return {
      id: row[0].toString(),
      slug: row[1].toString(),
      day: row[4] as number || 0,
      week: row[5] as number || 0,
      month: row[6] as number || 0,
      year: row[7] as number || 0,
      total: row[8] as number || 0,
      days: row[9] as number || 0,
      daysThisYear: row[10] as number || 0,
      included: (row[11] as DuckDBListValue).items as string[],
      coordinates: [row[2] as number || 0, row[3] as number || 0] as [number, number],
    }
  })

  return {
    props: {
      counts,
      buildTime: DateTime.local().toFormat('dd/LL/yyyy à HH:mm'),
    },
  };
};

export const metadata: Metadata = {
  title: 'Compteurs vélo à Paris',
};

export default function AllCounters({ counts, buildTime }: Props) {
  const [stats, setStats] = useState(counts);
  const [highlight, setHighlight] = useState(null);
  const [avg, setAvg] = useState(true);

  return (
    <>
      <div className="p-4 pb-8">
        <Link href="https://parisenselle.fr">
          <img
            className="float-left w-20 cursor-pointer"
            src="/logo.png"
            alt="Logo Paris en Selle"
          />
        </Link>
        <h1>Compteurs vélo à Paris</h1>
        <p className="text-sm">Page générée le {buildTime}</p>
      </div>
      <div className="pb-8">
        <div>
          <div>
            <input
              type="radio"
              id="avg"
              name="average"
              defaultChecked
              onClick={() => setAvg(true)}
            ></input>{' '}
            <label htmlFor="avg">moyenne journalière</label>
          </div>
          <div>
            <input
              type="radio"
              id="total"
              name="average"
              onClick={() => setAvg(false)}
            ></input>{' '}
            <label htmlFor="total">nombre total de passages</label>
          </div>
        </div>
        <div>
          Trier par activité décroissante sur :
          <div className="inline-block relative ml-2">
            <select
              className="block appearance-none border border-gray-400 hover:border-gray-500 px-1 py-1 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
              name="order"
              id="order"
              onChange={(e) =>
                setStats(_.sortBy(stats, e.target.value).reverse())
              }
            >
              <option value="day">la journée de hier</option>
              <option value="week">les 7 derniers jours</option>
              <option value="month">les 30 derniers jours</option>
              <option value="year">l’année en cours</option>
              <option value="days">l’ancienneté</option>
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

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="lg:row-span-2 lg:col-span-2 h-64 lg:h-auto">
          <Map counters={stats} highlight={highlight} />
        </div>
        {_.map(stats, (stat, index) => (
          <div className="rounded-xl bg-white" key={stat.id}>
            <Counter
              stat={stat}
              avg={avg}
              rank={index + 1}
              counterCount={stats.length}
              click={() => setHighlight(stat.id)}
            />
          </div>
        ))}
      </div>
      <div className="pt-8 text-sm w-1/2">
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
    </>
  );
}
