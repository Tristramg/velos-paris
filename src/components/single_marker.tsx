import maplibre from "maplibre-gl";
import React, { useEffect, useRef } from "react";
import { Protocol } from "pmtiles";

const Map = ({ coord }: { coord: [number, number] }) => {
	const mapContainer = useRef(null);

	// useEffect for the initialization of the map
	useEffect(() => {
		let protocol = new Protocol();
		maplibre.addProtocol("pmtiles", protocol.tile);
		const newMap = new maplibre.Map({
			container: mapContainer.current,
			style: "https://tuiles.enliberte.fr/styles/bright.json",
			center: coord,
			zoom: 16,
		});
		newMap.on("load", () => {
			newMap.resize();
			new maplibre.Marker().setLngLat(coord).addTo(newMap);
		});
	}, [coord]);

	return <div ref={mapContainer} className="map-small" />;
};

export default Map;
