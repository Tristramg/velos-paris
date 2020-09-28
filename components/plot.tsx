import { Counter, CounterDetails } from '../lib/types';
import React, { useEffect, useRef } from 'react';
import { TopLevelSpec as VlSpec } from 'vega-lite';
import vegaEmbed from 'vega-embed';
import { DateTime } from 'luxon';

type Props = {
  counters: Counter;
  period: string;
};
const Plot = ({ counters, period }: Props) => {
  const container = useRef(null);
  const timeUnit = {
    day: 'datehoursminutes',
    month: 'yearmonthdate',
    year: 'yearmonthdate',
  }[period];

  const format = {
    day: '%H:%S',
    month: '%Y-%m-%d',
    year: '%Y-%m-%d',
  }[period];

  const timeLabel = {
    day: 'heure',
    month: 'jour',
    year: 'semaine',
  }[period];

  useEffect(() => {
    const data: CounterDetails[] = counters[period].map(
      ({ time, count, id }) => ({
        time: DateTime.fromISO(time),
        count,
        id,
      })
    );

    const vegaSpec: VlSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      description: 'A simple bar chart with embedded data.',
      data: {
        values: data,
      },
      width: 600,
      mark: 'bar',
      encoding: {
        x: {
          field: 'time',
          axis: { formatType: 'time', format, title: '', labelAngle: 30 },
          type: 'ordinal',
          timeUnit,
        },
        y: {
          field: 'count',
          type: 'quantitative',
          axis: { title: 'Passages par ' + timeLabel },
          aggregate: 'sum',
        },
        color: { field: 'id', legend: { title: 'Compteur' } },
      },
    };

    vegaEmbed(container.current, vegaSpec);
  }, []);

  return (
    <div
      // eslint-disable-next-line no-return-assign
      ref={(el) => (container.current = el)}
      className="w-full border rounded-lg p-4 shadow-lg bg-white mb-3"
    />
  );
};

export default Plot;
