import { Marker, Popup, Polyline } from 'react-leaflet';
import useMarkerRotation from '../Hooks/useMarkerRotation';
import { useRef, useState } from 'react';
import { Button } from '@heroui/button';
import 'leaflet-rotatedmarker';
import L from 'leaflet';

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
  dataSource: string;
}

interface ShipMarkerProps {
  ship: Ship;
}

const regularShipIcon = new L.Icon({
  iconUrl: '/assets/icons/ship_regular.svg',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -10],
  className: 'ship-icon',
});

const militaryShipIcon = new L.Icon({
  iconUrl: '/assets/icons/ship_military.svg',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -10],
  className: 'military-ship-icon',
});

function ShipMarker({ ship }: ShipMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const [isTracking, setIsTracking] = useState(false);

  useMarkerRotation(
    markerRef.current,
    parseFloat(ship.trueHeading) || ship.course,
    'center'
  );

  const shipIcon =
    ship.shipType === '35' || ship.shipType === '55'
      ? militaryShipIcon
      : regularShipIcon;

  return (
    <>
      <Marker
        ref={markerRef}
        position={[ship.latitude, ship.longitude]}
        icon={shipIcon}
      >
        <Popup autoClose={false} closeOnClick={true}>
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
                  <td>
                    {ship.length}m × {ship.breadth}m
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-center pt-2">
                    <Button
                      size="md"
                      variant="light"
                      onPress={() => setIsTracking((prev) => !prev)}
                    >
                      {isTracking ? 'Stop Tracking' : 'Track Ship'}
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Popup>
      </Marker>
      {isTracking && ship.path.length > 1 && (
        <Polyline
          positions={ship.path.map((coord) => [coord[0], coord[1]])}
          color="blue"
          opacity={0.6}
          weight={3}
        />
      )}
    </>
  );
}

export default ShipMarker;
