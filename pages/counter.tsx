import Head from 'next/head';
import _ from 'lodash';
import { DateTime } from 'luxon';

import { metadatas, details } from '../data/read_data';
import {
  CounterDetails,
  ParsedCount,
  CounterMetadata,
  Counter,
} from '../lib/types.d';
import { strip } from '../lib/helpers';
import Plot from '../components/plot';

const counterId = 'Boulevard de Magenta';

const relevantIds = (metadata): string[] =>
  _(metadata)
    .toArray()
    .filter((counter) => strip(counter.name) === counterId)
    .map('id_compteur')
    .value();

const channelName = (
  id: string,
  metadata: { [id: string]: CounterMetadata }
): string => {
  if (metadata[id].channel_name !== '') {
    return metadata[id].channel_name;
  } else {
    return metadata[id].nom_compteur;
  }
};

const prepare = (
  ids: string[],
  details: CounterDetails[],
  metadata: { [id: string]: CounterMetadata }
): Counter => {
  const sorted = _(details)
    .filter((d) => ids.includes(d.id))
    .map(({ count, time, id }) => ({
      count,
      time,
      id: channelName(id, metadata),
    }))
    .sort((a, b) => (a.time < b.time ? -1 : 1))
    .value();

  const now = DateTime.local().set({ hour: 0, minute: 0, second: 0 });
  const oneDay = now.minus({ day: 1 }).toISO();
  const oneMonth = now.minus({ month: 1 }).toISO();
  return {
    name: ids[0],
    img: '',
    week: sorted.filter((d) => d.time >= oneDay),
    month: sorted.filter((d) => d.time >= oneMonth),
    year: _(sorted)
      .takeRight(365 * 24)
      .value(),
  };
};

export const getStaticProps = async () => {
  const metadata = await metadatas();
  const ids = relevantIds(metadata);
  const detailed = await details();

  const prep = prepare(ids, detailed, metadata);

  return {
    props: {
      details: prep,
      metadata,
    },
  };
};

export default function Counters({ details, metadata }) {
  return (
    <>
      <Head>
        <title>Compteurs vélo à Paris : détails pour</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Compteurs vélo à Paris détails</h1>
      <Plot counters={details} period={'week'} />
      <Plot counters={details} period={'month'} />
      <Plot counters={details} period={'year'} />
    </>
  );
}
