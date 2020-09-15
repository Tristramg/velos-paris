import mapboxgl from 'mapbox-gl'
import React, { useEffect, useState, useRef } from 'react'
import _ from 'lodash'

import { CounterStat } from '../lib/types.d'

const popupHTML = (counter: CounterStat): string => `
<h3>${counter.label}</h3>
<p><span class="font-bord">${counter.yesterday}</span> passages hier</p>
`

type Props = {
  counters: CounterStat[]
  highlight: string
}

const options = (highlight: boolean) => ({
  color: highlight ? '#CC8811' : '#3FB1CE',
})

const buildMarker = (counter: CounterStat, hl: boolean): mapboxgl.Marker =>
  new mapboxgl.Marker(options(hl))
    .setLngLat(counter.coordinates)
    .setPopup(new mapboxgl.Popup().setHTML(popupHTML(counter)))

const Map = ({ counters, highlight }: Props) => {
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState({})
  const [lastMarker, setLastMarker] = useState(null)
  const mapContainer = useRef(null)

  mapboxgl.accessToken =
    'pk.eyJ1IjoidHJpc3RyYW1nIiwiYSI6ImNrZDRpYTA2dTFxcmEycm83MzlnOWs1amUifQ.y6b0oAHEouiow3G5_g-lOg'

  // useEffect for the initialization of the map
  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [2.345, 48.86],
      zoom: 10,
    })
    newMap.on('load', () => {
      newMap.resize()
      for (const counter of counters) {
        const marker = buildMarker(counter, false)
        marker.addTo(newMap)
        markers[counter.id] = marker
      }
      setMap(newMap)
    })
  }, [])

  // useEffect to handle the highlighted marker
  useEffect(() => {
    if (lastMarker !== null) {
      markers[lastMarker].remove()
    }
    const counter = counters.find((counter) => counter.id === highlight)
    if (counter) {
      setLastMarker(highlight)
      const marker = buildMarker(counter, true)
      marker.addTo(map)
      markers[counter.id] = marker
      map.flyTo({ center: counter.coordinates, zoom: 12 })
    }
  }, [highlight])

  return (
    <div
      // eslint-disable-next-line no-return-assign
      ref={(el) => (mapContainer.current = el)}
      className="w-full min-h-full"
    />
  )
}

export default Map
