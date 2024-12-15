import { Counter } from '../lib/types';
import React, { useEffect, useRef } from 'react';
import { TopLevelSpec as VlSpec } from 'vega-lite';
import vegaEmbed from 'vega-embed';
import timeFormatLocale from '../data/locale_fr';

type Props = {
  counters: Counter;
};
const Heatmap = ({ counters }: Props) => {
  const container = useRef(null);

  useEffect(() => {
    const vegaSpec: VlSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      data: {
        values: counters['year_daily'],
      },
      title: 'Passages journaliers',
      config: { view: { strokeWidth: 0, step: 15 }, axis: { domain: false } },
      mark: { type: 'rect', height: 6 },
      encoding: {
        x: {
          field: 'time',
          timeUnit: 'day',
          type: 'ordinal',
          title: 'Jour de la semaine',
          sort: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
        y: {
          field: 'time',
          timeUnit: 'yearweek',
          type: 'ordinal',
          title: 'Semaine',
          scale: {
            padding: -3,
          },
        },
        color: {
          field: 'count',
          aggregate: 'sum',
          type: 'quantitative',
          legend: { title: 'Passages' },
          scale: { scheme: 'viridis' },
        },
        tooltip: [
          {
            field: 'time',
            title: 'Date',
            type: 'temporal',
            format: '%e %b %Y',
          },
          { field: 'count', aggregate: 'sum', title: 'Passages' },
        ],
      },
    };
    vegaEmbed(container.current, vegaSpec, { timeFormatLocale }).then((r) => r);
  }, []);

  return (
    <div ref={container} className="w-full rounded-xl p-6 bg-white mb-3" />
  );
};

export default Heatmap;
