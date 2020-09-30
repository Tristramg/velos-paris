import mapboxgl from 'mapbox-gl';
import React, { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import * as d3 from 'd3-scale';

import { CounterStat } from '../lib/types.d';

const popupHTML = (counter: CounterStat): string => `
<h3>${counter.label}</h3>
<p><span class="font-bord">${counter.day}</span> passages hier</p>
`;

type Props = {
  counters: CounterStat[];
  highlight: string;
};

const options = (highlight: boolean, count: number, max: number) => {
  const colors = ['#20B4FF', '#8AD1A4', '#F5EE4A', '#FA7725', '#FE0000'];
  const scale = d3.scaleLinear(
    [0, max * 0.25, max * 0.5, max * 0.75, max],
    colors
  );
  return {
    color: highlight ? '#CC8811' : scale(count),
  };
};

const buildMarker = (
  counter: CounterStat,
  hl: boolean,
  max: number
): mapboxgl.Marker =>
  new mapboxgl.Marker(options(hl, counter.day, max))
    .setLngLat(counter.coordinates)
    .setPopup(new mapboxgl.Popup().setHTML(popupHTML(counter)));

const Map = ({ counters, highlight }: Props) => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({});
  const [lastMarker, setLastMarker] = useState(null);
  const mapContainer = useRef(null);
  const max = _.maxBy(counters, 'day').day;

  mapboxgl.accessToken =
    'pk.eyJ1IjoidHJpc3RyYW1nIiwiYSI6ImNrZDRpYTA2dTFxcmEycm83MzlnOWs1amUifQ.y6b0oAHEouiow3G5_g-lOg';

  // useEffect for the initialization of the map
  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [2.345, 48.86],
      zoom: 10,
    });
    newMap.on('load', () => {
      newMap.resize();
      // We reverse to display the smallest counters on the bottom
      for (const counter of counters.reverse()) {
        const marker = buildMarker(counter, false, max);
        marker.addTo(newMap);
        markers[counter.id] = marker;
      }
      setMap(newMap);
    });
  }, []);

  // useEffect to handle the highlighted marker
  useEffect(() => {
    if (lastMarker !== null) {
      markers[lastMarker].remove();
    }
    const counter = counters.find((counter) => counter.id === highlight);
    if (counter) {
      setLastMarker(highlight);
      const marker = buildMarker(counter, true);
      marker.addTo(map);
      markers[counter.id] = marker;
      setMarkers(markers);
      map.flyTo({ center: counter.coordinates, zoom: 12 });
    }
  }, [highlight]);

  return (
    <div
      // eslint-disable-next-line no-return-assign
      ref={(el) => (mapContainer.current = el)}
      className="w-full min-h-full"
    />
  );
};

export default Map;
