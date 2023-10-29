import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps, Metadata } from 'next';
import fs from 'fs';
import _ from 'lodash';
import slugify from 'slugify';

import Plot from '../../components/plot';
import SingleMarker from '../../components/single_marker';
import { metadatas, buildTime } from '../../data/read_data';
import {
  CounterMetadata,
  Detail,
  Counter,
  CounterDetails,
} from '../../lib/types';
import { strip } from '../../lib/helpers';
import Heatmap from '../../components/heatmap';
import { DateTime } from 'luxon';

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const f = fs.readFileSync(`./public/data/${params.counter}.json`);
  const json = JSON.parse(f.toString());
  return {
    props: {
      details: json,
      buildTime: await buildTime(),
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const counters = await metadatas();
  const paths = _.map(counters, (c: CounterMetadata) => ({
    params: { counter: slugify(strip(c.name)) },
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
    return <a href={detail.img} target="blank">
      <img src={detail.img} alt={`Image du compteur${detail.name}`} />
    </a>;
  }
  return null;
}
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
}

export async function generateMetadata({ details }: Props): Promise<Metadata> {
  return {
    title: `Détails du comptage {details.title}`
  }
}


export default function Counters({
  details,
  buildTime,
}: Props) {
  const dedup: Detail[] = _.uniqBy(details['details'], 'img');
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
          {dedup.map((detail: Detail) => (
            <DetailComponent key={detail.name} detail={detail} />
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
