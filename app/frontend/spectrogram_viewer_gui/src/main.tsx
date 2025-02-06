import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import MapComponent from './Components/MapComponent';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MapComponent />
  </StrictMode>
);
