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
      config: { view: { strokeWidth: 0, step: 20 }, axis: { domain: false } },
      mark: 'rect',
      encoding: {
        x: {
          field: 'time',
          timeUnit: 'date',
          type: 'ordinal',
          title: 'Jour',
          axis: { labelAngle: 0, format: '%e' },
        },
        y: {
          field: 'time',
          timeUnit: 'month',
          type: 'ordinal',
          title: 'Mois',
        },
        color: {
          field: 'count',
          aggregate: "sum",
          type: 'quantitative',
          legend: { title: 'Passages' },
        },
        tooltip: [
          {
            field: 'time',
            title: 'Date',
            type: 'temporal',
            format: '%e %b %Y',
          },
          { field: 'count', aggregate: "sum", title: 'Passages' },
        ],
      },
    };
    vegaEmbed(container.current, vegaSpec, { timeFormatLocale }).then((r) => r);
  }, []);

  return (
    <div
      // eslint-disable-next-line no-return-assign
      ref={(el) => (container.current = el)}
      className="w-full rounded-xl p-6 bg-white mb-3"
    />
  );
};

export default Heatmap;
