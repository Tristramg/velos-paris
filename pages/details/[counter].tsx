import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import fs from 'fs';
import _ from 'lodash';
import slugify from 'slugify';

import Plot from '../../components/plot';
import SingleMarker from '../../components/single_marker';
import { metadatas } from '../../data/read_data';
import { CounterMetadata } from '../../lib/types';
import { strip } from '../../lib/helpers';

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const f = fs.readFileSync(`./public/data/${params.counter}.json`);
  const json = JSON.parse(f.toString());
  return {
    props: {
      details: json,
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

type Detail = {
  name: string;
  img: string;
  date: string;
  coord: [number, number];
};

const Detail = ({ detail }: { detail: Detail }) => (
  <div className="rounded-xl p-6 bg-white mb-4">
    <h3>{detail.name}</h3>
    <p>
      <span className="font-bold">Installé le </span>
      {detail.date}
    </p>
    <img src={detail.img} alt={`Image du compteur${detail.name}`}></img>
    <SingleMarker coord={detail.coord} />
  </div>
);

export default function Counters({ details }) {
  return (
    <>
      <Head>
        <title>Détails du comptage {details.title}</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <h1>Détails du comptage {details.title}</h1>
      <span className="text-sm">
        <Link href="/">Retour à l’accueil</Link>
      </span>
      <div className="flex flex-wrap-reverse p-4">
        <div className="md:w-1/3 w-full pr-4">
          {details.details.map((detail: Detail) => (
            <Detail key={detail.name} detail={detail} />
          ))}
        </div>
        <div className="md:w-2/3 w-full">
          <Plot counters={details} period={'day'} />
          <Plot counters={details} period={'month'} />
          <Plot counters={details} period={'year'} />
        </div>
      </div>
    </>
  );
}
