import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import ShipMarker from './ShipMarker';
import { useShipsInRange } from '../Hooks/useShipsInRange';
import { useMapInteraction } from '../Hooks/useMapInteraction';

function MapClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    }
  });
  
  return null;
}

function MapViewSynchronizer({ position }: { position: { latitude: number, longitude: number } }) {
  const map = useMap();
  const prevPositionRef = useRef(position);
  
  useEffect(() => {
    if (prevPositionRef.current.latitude !== position.latitude || 
        prevPositionRef.current.longitude !== position.longitude) {
      map.setView([position.latitude, position.longitude]);
      prevPositionRef.current = position;
    }
  }, [map, position]);
  
  return null;
}

const MapComponent = () => {
  const { position, handlePositionChange } = useMapInteraction();
  const { shipsInRange } = useShipsInRange();

  return (
    <div className="h-full">
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapClickHandler onPositionChange={handlePositionChange} />
        <MapViewSynchronizer position={position} />
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" //url="http://localhost:8080/styles/basic-preview/512/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {shipsInRange.map((ship) => (
          <ShipMarker key={ship.mmsi} ship={ship} />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
