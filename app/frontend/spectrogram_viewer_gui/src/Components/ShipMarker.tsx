import React, { useMemo } from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface Ship {
  mmsi: string;
  shipName: string;
  shipType: string;
  aisClass: string;
  callsign: string;
  speed: string;
  destination: string;
  trueHeading: string;
  length: string;
  breadth: string;
  latitude: number;
  longitude: number;
  dateTimeUtc: Date;
  course: number;
  path: [number, number][];
}

const regularShipIcon = new L.Icon({
  iconUrl: '/assets/icons/ship.svg',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
  className: 'ship-icon'
});

const militaryShipIcon = new L.Icon({
    iconUrl: '/assets/icons/ship1.svg',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
    className: 'military-ship-icon',
  });


const ShipMarker: React.FC<{ ship: Ship }> = ({ ship }) => {
  const shipIcon =
  ship.shipType === '35' || ship.shipType === '55' || ship.shipType === '51'
    ? militaryShipIcon
    : regularShipIcon;


  return (
    <>
      <Marker
        position={[ship.latitude, ship.longitude]}
        icon={shipIcon}
        rotationAngle={parseFloat(ship.trueHeading) || ship.course}
        rotationOrigin="center"
      >
        <Popup>
          <div className="ship-popup">
            <h3 className="font-bold mb-2">{ship.shipName}</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="font-semibold">MMSI:</td>
                  <td>{ship.mmsi}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Type:</td>
                  <td>{ship.shipType}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Class:</td>
                  <td>{ship.aisClass}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Speed:</td>
                  <td>{ship.speed} knots</td>
                </tr>
                <tr>
                  <td className="font-semibold">Heading:</td>
                  <td>{ship.trueHeading}°</td>
                </tr>
                <tr>
                  <td className="font-semibold">Destination:</td>
                  <td>{ship.destination}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Size:</td>
                  <td>{ship.length}m × {ship.breadth}m</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Popup>
      </Marker>
      {ship.path.length > 1 && (
        <Polyline 
          positions={ship.path.map(coord => [coord[1], coord[0]])} 
          color="blue" 
          opacity={0.6} 
          weight={2}
        />
      )}
    </>
  );
};

export default ShipMarker;