import Head from 'next/head';

import Plot from '../components/plot';
import { GetStaticPaths, GetStaticProps } from 'next';
import fs from 'fs';

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const f = fs.readFileSync(`./public/data/Boulevard de Magenta.json`);
  const json = JSON.parse(f.toString());
  return {
    props: {
      details: json,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [{ params: { counter: 'moo' } }],
    fallback: false,
  };
};

export default function Counters({ details }) {
  return (
    <>
      <Head>
        <title>Compteurs vélo à Paris : détails pour</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Compteurs vélo à Paris détails</h1>
      <div className="flex">
        <Plot counters={details} period={'day'} />
        <Plot counters={details} period={'month'} />
        <Plot counters={details} period={'year'} />
      </div>
    </>
  );
}
