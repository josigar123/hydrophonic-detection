import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import ShipMarker, { Ship } from './ShipMarker';
import { useShips } from '../Hooks/useShips';

const MapComponent = () => {
  const [center] = useState<[number, number]>([59.431633, 10.478039]);
  const { ships } = useShips();

  return (
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="http://localhost:8080/styles/basic-preview/512/{z}/{x}/{y}.png"
          />
          {ships
            .map((ship: Ship) => (
              <ShipMarker key={ship.mmsi} ship={ship} />
            ))}
        </MapContainer>
  );
};

export default MapComponent;
