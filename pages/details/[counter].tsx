import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps, Metadata } from 'next';
import _ from 'lodash';

import Plot from '../../components/plot';
import SingleMarker from '../../components/single_marker';
import { Detail, Counter, CounterDetails } from '../../lib/types';
import Heatmap from '../../components/heatmap';
import { DateTime } from 'luxon';
import { DuckDBInstance } from '@duckdb/node-api';

const counter_data = (table, slug, constraint) => `
SELECT channel_name, sum_counts, date
FROM ${table}_view
WHERE slug='${slug}'
${constraint}
`;

const data = async (table, slug, connection, constraint = '') => {
  const counts = await connection.run(counter_data(table, slug, constraint));
  const rows = await counts.getRows();
  return rows.map((row) => ({
    id: row[0],
    count: row[1],
    time: row[2],
  }));
};

const getRecords = async (slug, connection) => {
  const query = `
  SELECT
    hour_record, hour_record_date,
    day_record, day_record_date,
    week_record, week_record_date,
  FROM records
  WHERE slug='${slug}'`;

  const records = await connection.run(query);
  const row = await records.getRows();
  return {
    hour: {
      count: row[0][0],
      time: row[0][1],
    },
    day: {
      count: row[0][2],
      time: row[0][3],
    },
    week: {
      count: row[0][4],
      time: row[0][5],
    },
  };
};

const getSingleCounters = async (slug, connection) => {
  const query = `
  SELECT
    nom_compteur, url_photos_n1, single_counter.installation_date::TEXT,
    single_counter.longitude, single_counter.latitude
  FROM single_counter
  JOIN counter_group ON single_counter.name = counter_group.name
  WHERE slug='${slug}'`;

  const result = await connection.run(query);
  const counters = await result.getRows();
  return counters.map((counter) => ({
    name: counter[0],
    img: counter[1],
    date: counter[2],
    coord: [counter[3], counter[4]],
  }));
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const instance = await DuckDBInstance.create('compteurs.duckdb', {
    access_mode: 'READ_ONLY',
  });
  const connection = await instance.connect();
  const name = await connection.run(
    `SELECT name, url_photo, longitude, latitude FROM counter_group WHERE slug = '${params.counter}'`
  );
  const metadata = await name.getRows();
  const records = await getRecords(params.counter, connection);

  return {
    props: {
      details: {
        title: metadata[0][0].toString(),
        hour_record: records.hour, //record(sorted, { minute: 0, second: 0 }),
        day_record: records.day, //record(sorted, dayFmt),
        week_record: records.week, //record(sorted, weekFmt),
        day: await data('hourly', params.counter, connection),
        month: await data(
          'daily',
          params.counter,
          connection,
          'AND (date::date).date_add(INTERVAL 31 DAY) > current_date'
        ),
        year: await data('weekly', params.counter, connection),
        year_daily: await data('daily', params.counter, connection),
        buildTime: DateTime.local().toFormat('dd/LL/yyyy à HH:mm'),
        details: await getSingleCounters(params.counter, connection),
        coord: [metadata[0][2], metadata[0][3]],
      },
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const instance = await DuckDBInstance.create('compteurs.duckdb', {
    access_mode: 'READ_ONLY',
  });
  const connection = await instance.connect();

  const metadata = await connection.run('SELECT slug FROM counter_group');
  const rows = await metadata.getRows();
  const paths = rows.map((row) => ({
    params: {
      counter: row[0].toString(),
    },
  }));

  return {
    paths,
    fallback: false,
  };
};

const fmtDate = (detail: CounterDetails, format: string): string => {
  return DateTime.fromISO(detail.time).toFormat(format);
};

const ImageComponent = function ({ detail }: { detail: Detail }) {
  if (detail.img) {
    return (
      <a href={detail.img} target="blank">
        <img src={detail.img} alt={`Image du compteur${detail.name}`} />
      </a>
    );
  }
  return null;
};

const DetailComponent = ({ detail }: { detail: Detail }) => (
  <div className="rounded-xl p-6 bg-white mb-4">
    <h3>{detail.name}</h3>
    {detail.date && <p>Installé le {detail.date}</p>}
    <ImageComponent detail={detail} />
    <SingleMarker coord={detail.coord} />
  </div>
);

type Props = {
  details: Counter;
  buildTime: string;
};

export async function generateMetadata({ details }: Props): Promise<Metadata> {
  return {
    title: `Détails du comptage { details.title } `,
  };
}

export default function Counters({ details, buildTime }: Props) {
  return (
    <>
      <div className="p-4">
        <Link href="https://parisenselle.fr">
          <img
            className="float-left w-20 cursor-pointer"
            src="/logo.png"
            alt="Logo Paris en Selle"
          />
        </Link>
        <h1>Détails du comptage {details.title}</h1>
        <p className="text-sm">Page générée le {buildTime}</p>
      </div>
      <span className="text-sm">
        <Link href="/">Retour à l’accueil</Link>
      </span>
      <div className="flex flex-wrap-reverse p-4">
        <div className="md:w-1/3 w-full pr-4">
          {details.details.map((single_counter) => (
            <DetailComponent
              key={single_counter.name}
              detail={single_counter}
            />
          ))}
        </div>
        <div className="md:w-2/3 w-full">
          <div className="w-full rounded-xl p-6 bg-white mb-3">
            <h3>Records de passage</h3>
            <ul>
              <li>
                Sur une heure :{' '}
                <span className="font-bold">{details.hour_record.count}</span>,
                le {fmtDate(details.hour_record, 'dd/LL/yyyy à HH:mm')}
              </li>
              <li>
                Sur une journée :{' '}
                <span className="font-bold">{details.day_record.count}</span>,
                le {fmtDate(details.day_record, 'dd/LL/yyyy')}
              </li>
              <li>
                Sur une semaine :{' '}
                <span className="font-bold">{details.week_record.count}</span>,
                la semaine du {fmtDate(details.week_record, 'dd/LL/yyyy')}
              </li>
            </ul>
          </div>
          <Plot counters={details} period={'day'} />
          <Plot counters={details} period={'month'} />
          <Plot counters={details} period={'year'} />
          <Heatmap counters={details} />
        </div>
      </div>
    </>
  );
}
