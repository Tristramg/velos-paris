import type { Counter } from "../lib/types";
import React, { useEffect, useRef } from "react";
import type { TopLevelSpec } from "vega-lite";
import vegaEmbed from "vega-embed";
import timeFormatLocale from "../data/locale_fr";

type Props = {
	counters: Counter;
};

const Cumulative = ({ counters }: Props) => {
	const container = useRef(null);
	const currentYear = new Date().getFullYear();

	useEffect(() => {
		const vegaSpec: TopLevelSpec = {
			$schema: "https://vega.github.io/schema/vega-lite/v4.json",
			description: "Cumul des passages de vélo depuis le 1er janvier",
			title: {
				text: "Cumul des passages depuis le 1er janvier",
				subtitle: "Comparaison année par année",
			},
			data: {
				values: counters.cumulative,
			},
			width: "container",
			height: 320,
			mark: {
				type: "line",
				interpolate: "monotone",
				point: false,
			},
			encoding: {
				x: {
					field: "time",
					type: "temporal",
					title: "",
					scale: {
						// Les mois des objets datetime Vega sont numérotés de 1 à 12.
						domain: [
							{ year: 2024, month: 1, date: 1 },
							{ year: 2024, month: 12, date: 31 },
						],
					},
					axis: {
						format: "%b",
						tickCount: "month",
						labelAngle: 0,
						grid: true,
					},
				},
				y: {
					field: "total",
					type: "quantitative",
					title: "Passages cumulés",
					axis: { format: ",d" },
				},
				color: {
					field: "year",
					type: "nominal",
					title: "Année",
					sort: "descending",
					scale: { scheme: "tableau10" },
				},
				strokeWidth: {
					condition: {
						test: `datum.year === ${currentYear}`,
						value: 3,
					},
					value: 1.5,
				},
				tooltip: [
					{ field: "year", title: "Année" },
					{ field: "time", title: "Jour", type: "temporal", format: "%e %b" },
					{ field: "total", title: "Cumul", format: ",d" },
				],
			},
		};

		vegaEmbed(container.current, vegaSpec, { timeFormatLocale }).then((r) => r);
	}, [counters, currentYear]);

	return <div ref={container} className="plot-container" />;
};

export default Cumulative;
