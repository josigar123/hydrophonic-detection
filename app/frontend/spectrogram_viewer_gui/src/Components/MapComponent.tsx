import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import ShipMarker, { Ship } from './ShipMarker';
import { useShips } from '../Hooks/useShips';
import { getHaversineDistance } from '../Utils/distance';

const MAX_RANGE = 200; // km

const MapComponent = () => {
  const [center] = useState<[number, number]>([59.431633, 10.478039]);
  const { ships } = useShips();

  return (
    <div className="h-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="http://localhost:8080/styles/basic-preview/512/{z}/{x}/{y}.png"
        />
        {ships.filter(
          (ship: Ship) =>
            getHaversineDistance(
              ship.latitude,
              ship.longitude,
              center[0],
              center[1]
            ) < MAX_RANGE
        ).map((ship: Ship) => (
          <ShipMarker key={ship.mmsi} ship={ship} />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
