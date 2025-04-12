import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap, Marker, Popup } from 'react-leaflet';
import ShipMarker from './ShipMarker';
import { HydrophoneMarker } from './HydrophoneMarker';
import { useShipsInRange } from '../Hooks/useShipsInRange';
import { useMapInteraction } from '../Hooks/useMapInteraction';
import L from 'leaflet';

interface MapComponentProps {
  isMonitoring: boolean;
}

const userPositionIcon = new L.Icon({
  iconUrl: '/assets/icons/flag.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -10],
  className: 'user-icon',
});

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

const MapComponent = ({ isMonitoring }: MapComponentProps)=> {
  const { position, handlePositionChange } = useMapInteraction();
  const { shipsInRange } = useShipsInRange(isMonitoring);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <MapClickHandler onPositionChange={handlePositionChange} />
        <MapViewSynchronizer position={position} />
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" //url="http://localhost:8080/styles/basic-preview/512/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <HydrophoneMarker isMonitoring={isMonitoring} />

        <Marker position = {[position.latitude, position.longitude]}
         icon={userPositionIcon}>
          <Popup className="min-w-[200px]">
            <div className="text-base font-semibold">
              <h3 className="text-lg text-blue-600 border-b pb-1 mb-2 text-center">Current Position</h3>
              <div>
                <p className="mb-1">Latitude: {position.latitude}°</p>
                <p>Longitude: {position.longitude}°</p>
              </div>
            </div>
          </Popup>
        </Marker>
        {shipsInRange.map((ship) => (
          <ShipMarker key={ship.mmsi} ship={ship} />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
