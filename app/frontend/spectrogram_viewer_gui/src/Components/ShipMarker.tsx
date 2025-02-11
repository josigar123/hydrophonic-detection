import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import shipSvg from '/assets/icons/ship.svg';

const shipIcon = new L.Icon({
  iconUrl: shipSvg,
  iconSize: [20, 20],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'ship-icon',
});

interface Ship {
  mmsi: string;
  ship_name: string;
  callsign: string;
  speed: string;
  destination: string;
  true_heading: string;
  length: string;
  breadth: string;
  latitude: number;
  longitude: number;
}

const ShipMarker: React.FC<{ ship: Ship }> = ({ ship }) => {
  return (
    <Marker
      key={ship.mmsi}
      position={[ship.latitude, ship.longitude]}
      icon={shipIcon}
      eventHandlers={{
        click: () => {
          console.log(`Clicked on: ${ship.ship_name}, MMSI: ${ship.mmsi}`);
        },
      }}
    >
      <Popup>
        <strong>Ship Name:</strong> {ship.ship_name} <br />
        <strong>MMSI:</strong> {ship.mmsi} <br />
        <strong>Call Sign:</strong> {ship.callsign} <br />
        <strong>Speed:</strong> {ship.speed} knots <br />
        <strong>Destination:</strong> {ship.destination} <br />
        <strong>Heading:</strong> {ship.true_heading}° <br />
        <strong>Length:</strong> {ship.length} m <br />
        <strong>Breadth:</strong> {ship.breadth} m
      </Popup>
    </Marker>
  );
};

export default ShipMarker;
