import { Counter, CounterDetails } from '../lib/types';
import React, { useEffect, useRef } from 'react';
import vegaEmbed from 'vega-embed';
import { DateTime } from 'luxon';

type Props = {
  counters: Counter;
  period: string;
};
const Plot = ({ counters, period }: Props) => {
  const container = useRef(null);
  const timeUnit = {
    week: 'hoursminutes',
    month: 'yearmonthdate',
    year: 'week',
  }[period];

  const format = {
    week: '%H:%S',
    month: '%Y-%m-%d',
    year: 'S%V',
  }[period];

  const timeLabel = {
    week: 'heure',
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

    const vegaSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      description: 'A simple bar chart with embedded data.',
      data: {
        values: data,
      },
      mark: 'bar',
      encoding: {
        x: {
          field: 'time',
          axis: { formatType: 'time', format, title: '' },
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

    vegaEmbed(container.current, JSON.stringify(vegaSpec));
  }, []);

  return (
    <div
      // eslint-disable-next-line no-return-assign
      ref={(el) => (container.current = el)}
      className="w-full min-h-full bg-white"
    />
  );
};

export default Plot;
