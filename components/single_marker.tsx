import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef } from 'react';

const Map = ({ coord }: { coord: [number, number] }) => {
  const mapContainer = useRef(null);

  mapboxgl.accessToken =
    'pk.eyJ1IjoidHJpc3RyYW1nIiwiYSI6ImNrZDRpYTA2dTFxcmEycm83MzlnOWs1amUifQ.y6b0oAHEouiow3G5_g-lOg';

  // useEffect for the initialization of the map
  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: coord,
      zoom: 16,
    });
    newMap.on('load', () => {
      newMap.resize();
      new mapboxgl.Marker().setLngLat(coord).addTo(newMap);
    });
  }, []);

  return (
    <div
      // eslint-disable-next-line no-return-assign
      ref={(el) => (mapContainer.current = el)}
      className="w-full h-64"
    />
  );
};

export default Map;
