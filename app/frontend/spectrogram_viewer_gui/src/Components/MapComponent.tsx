import { useRef, useEffect, useCallback } from 'react';
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

// Component to handle map resize events
function MapResizeHandler() {
  const map = useMap();
  
  // Set up a resize observer to detect container size changes
  useEffect(() => {
    // Force map to update its size
    const handleResize = () => {
      map.invalidateSize();
    };
    
    // Invalidate size once on mount
    handleResize();
    
    // Set up a resize observer to detect container size changes, including from scaling
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    
    // Get the container element
    const container = map.getContainer();
    resizeObserver.observe(container);
    
    // Add a small delay for initial render
    const timeoutId = setTimeout(() => {
      handleResize();
    }, 200);
    
    // Clean up
    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [map]);
  
  return null;
}

// Component to capture the map reference using useMap hook
function MapRefCapture({ setMapRef }: { setMapRef: (map: L.Map) => void }) {
  const map = useMap();
  
  useEffect(() => {
    setMapRef(map);
  }, [map, setMapRef]);
  
  return null;
}

const MapComponent = ({ isMonitoring }: MapComponentProps)=> {
  const { position, handlePositionChange } = useMapInteraction();
  const { shipsInRange } = useShipsInRange(isMonitoring);
  const mapRef = useRef<L.Map | null>(null);

  const setMapRefFromChild = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  // Handle resize when component updates
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, []);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        whenReady={() => {
        }}
      >
        <MapClickHandler onPositionChange={handlePositionChange} />
        <MapViewSynchronizer position={position} />
        <MapResizeHandler />
        <MapRefCapture setMapRef={setMapRefFromChild} />
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
