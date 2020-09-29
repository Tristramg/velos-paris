import { Counter, CounterDetails } from '../lib/types';
import React, { useEffect, useRef } from 'react';
import { TopLevelSpec as VlSpec } from 'vega-lite';
import vegaEmbed from 'vega-embed';
import { DateTime } from 'luxon';
import timeFormatLocale from '../data/locale_fr';

type Props = {
  counters: Counter;
  period: string;
};
const Plot = ({ counters, period }: Props) => {
  const container = useRef(null);
  const timeUnit = {
    day: 'datehours',
    month: 'yearmonthdate',
    year: 'yearweek',
  }[period];

  const timeLabel = {
    day: 'heure',
    month: 'jour',
    year: 'semaine',
  }[period];

  const axis = {
    day: {
      title: '',
      tickCount: 8,
      labelAlign: 'left',
      labelExpr:
        "[timeFormat(datum.value, '%H:%M'), timeFormat(datum.value, '%H') == '00' ? timeFormat(datum.value, '%e %b') : '']",
      labelOffset: 4,
      labelPadding: -24,
      tickSize: 30,
      gridDash: {
        condition: {
          test: { field: 'value', timeUnit: 'hours', equal: 0 },
          value: [],
        },
        value: [2, 2],
      },
      tickDash: {
        condition: {
          test: { field: 'value', timeUnit: 'hours', equal: 0 },
          value: [],
        },
        value: [2, 2],
      },
    },
    month: {
      formatType: 'time',
      format: '%e %b %Y',
      title: '',
      labelAngle: 30,
    },
    year: {
      title: '',
      tickCount: { interval: 'week', step: 10 },
      labelAngle: 0,
      labelAlign: 'left',
      labelExpr:
        "[timeFormat(datum.value, 'Semaine %W'), timeFormat(datum.value, '%m') == '01' ? timeFormat(datum.value, '%Y') : '']",
      labelOffset: 4,
      labelPadding: -24,
      tickSize: 30,
      gridDash: {
        condition: {
          test: { field: 'value', timeUnit: 'month', equal: 1 },
          value: [],
        },
        value: [2, 2],
      },
      tickDash: {
        condition: {
          test: { field: 'value', timeUnit: 'month', equal: 1 },
          value: [],
        },
        value: [2, 2],
      },
    },
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
          axis,
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

    vegaEmbed(container.current, vegaSpec, { timeFormatLocale }).then((r) => r);
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
