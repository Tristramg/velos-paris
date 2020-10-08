import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef } from 'react';

const Map = ({ coord }: { coord: [number, number] }) => {
  const mapContainer = useRef(null);

  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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
