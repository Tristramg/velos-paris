import maplibre from "maplibre-gl";
import React, { useEffect, useState, useRef } from "react";
import _ from "lodash";
import * as d3 from "d3-scale";
import type { CounterStat } from "../lib/types";
import { Protocol } from "pmtiles";

const popupHTML = (counter: CounterStat): string => `
<h3>${counter.id}</h3>
<p><b>${counter.day}</b> passages hier</p>
<a href=/details/${counter.slug}>Voir les détails</a>
`;

type Props = {
	counters: CounterStat[];
	highlight: string;
};

const options = (highlight: boolean, count: number, max: number) => {
	const colors = ["#20B4FF", "#8AD1A4", "#F5EE4A", "#FA7725", "#FE0000"];
	const scale = d3.scaleLinear(
		[0, max * 0.25, max * 0.5, max * 0.75, max],
		colors,
	);
	return {
		color: highlight ? "#CC8811" : scale(count),
	};
};

const buildMarker = (
	counter: CounterStat,
	hl: boolean,
	max: number,
): maplibre.Marker =>
	new maplibre.Marker(options(hl, counter.day, max))
		.setLngLat(counter.coordinates)
		.setPopup(new maplibre.Popup().setHTML(popupHTML(counter)));

const Map = ({ counters, highlight }: Props) => {
	const [map, setMap] = useState(null);
	const [markers, setMarkers] = useState({});
	const [lastMarker, setLastMarker] = useState(null);
	const mapContainer = useRef(null);
	const max = _.maxBy(counters, "day").day;

	// useEffect for the initialization of the map
	useEffect(() => {
		let protocol = new Protocol();
		maplibre.addProtocol("pmtiles", protocol.tile);
		const newMap = new maplibre.Map({
			container: mapContainer.current,
			style: "https://tuiles.enliberte.fr/styles/bright.json",
			center: import.meta.env.PUBLIC_MAPLIBRE_CENTER.split(",").map(
				(c) => +c,
			) as [number, number],
			zoom: parseFloat(import.meta.env.PUBLIC_MAPLIBRE_ZOOM),
		});
		newMap.addControl(new maplibre.NavigationControl());
		newMap.on("load", () => {
			newMap.resize();
			// We reverse to display the smallest counters on the bottom
			for (const counter of counters.slice().reverse()) {
				const marker = buildMarker(counter, false, max);
				marker.addTo(newMap);
				markers[counter.id] = marker;
			}
			setMap(newMap);
		});
	}, [counters, markers, max]);

	// useEffect to handle the highlighted marker
	useEffect(() => {
		if (lastMarker !== null) {
			markers[lastMarker].remove();
		}
		const counter = counters.find((counter) => counter.id === highlight);
		if (counter) {
			setLastMarker(highlight);
			const marker = buildMarker(counter, true, max);
			marker.addTo(map);
			markers[counter.id] = marker;
			setMarkers(markers);
			map.flyTo({ center: counter.coordinates, zoom: 13.5 });
		}
	}, [highlight, counters, lastMarker, map, markers, max]);

	return <div ref={mapContainer} className="map-full" />;
};

export default Map;
