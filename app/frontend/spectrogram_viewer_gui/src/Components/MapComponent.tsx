import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ShipMarker from './ShipMarker';

const ships = [ //Static ships for test-purposes
  {mmsi: '255806300', speed: '14.9', length: '135', status: '0', breadth: '22', callsign: 'CQAX2', maneuvre: '0', 
    ais_class: 'A', ship_name: 'ENERGY', ship_type: '71', destination: 'GBIMM', true_heading: '274', latitude: 59.443766, longitude: 10.505762},

  {mmsi: '636021470', speed: '0', length: '364', status: '0', breadth: '18', callsign: 'V2HF9', maneuvre: '0', 
    ais_class: 'B', ship_name: 'MSC MARA', ship_type: '71', destination: 'BEZEE=>NEANR', true_heading: '139', latitude: 59.432681, longitude: 10.469885},

  {mmsi: '435021770', speed: '5', length: '39', status: '0', breadth: '11', callsign: 'V2HF9', maneuvre: '0', 
    ais_class: 'B', ship_name: 'Fram', ship_type: '71', destination: 'HORTEN', true_heading: '139', latitude: 59.434165, longitude: 10.515032}
];
const ClickLocationPopup = () => {
  const [position, setPosition] = useState<{ lat: number, lng: number } | null>(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng)
    }
  });

  return ( position === null ? null :
    <Marker position = {position}>
      <Popup> 
        Latitude: {position.lat.toFixed(6)}  <br/>
        Longitude:{position.lng.toFixed(6)}
      </Popup>
    </Marker>
  )
}

const MapComponent: React.FC = () => {

  return (
    <div style={{padding: '60px' }}>
      <MapContainer 
        center={[59.431633, 10.478039]} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '600px', width: '900px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {ships.map((ship) => (
          <ShipMarker key={ship.mmsi} ship={ship} />
        ))}
        <ClickLocationPopup />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
