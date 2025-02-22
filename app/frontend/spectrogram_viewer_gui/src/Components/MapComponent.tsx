import React, { useEffect, useCallback, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ShipMarker, { Ship } from './ShipMarker';
import axios from 'axios';


const REFRESH_INTERVAL = 10000;
const range = 200; //km

const getHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180.0;
  const dLng = (lng2 - lng1) * Math.PI / 180.0;

  lat1 = (lat1) * Math.PI / 180.0;
  lat2 = (lat2) * Math.PI / 180.0;

  const halfChordSquared = Math.pow(Math.sin(dLat / 2), 2) +
            Math.pow(Math.sin(dLng / 2), 2) *
            Math.cos(lat1) *
            Math.cos(lat2);
  const angularDistance = 2 * Math.asin(Math.sqrt(halfChordSquared));

  const haversineDistance = earthRadius * angularDistance;

  return haversineDistance;
}

const MapComponent = () => {

  const [ships, setShips] = useState<Ship[]>([]);
  const [center] = useState<[number, number]>([59.431633, 10.478039]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextUpdateIn, setNextUpdateIn] = useState(REFRESH_INTERVAL);

  const fetchShips = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await axios.get('https://kystdatahuset.no/ws/api/ais/realtime/geojson');
      const features = response.data.features;

      if (!Array.isArray(features)) {
        throw new Error('Invalid data format received');
      }

      const shipData = features
        .filter((feature): feature is any => {
          const coords = feature?.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length === 0) return false;

          const lastPosition = coords[coords.length - 1];
          if (!Array.isArray(lastPosition) || lastPosition.length !== 2) return false;

          const [lon, lat] = lastPosition;
          return (
            typeof lat === 'number' && 
            typeof lon === 'number' && 
            !isNaN(lat) && 
            !isNaN(lon) && 
            lat >= -90 && 
            lat <= 90 && 
            lon >= -180 && 
            lon <= 180
          );
        })
        .map(feature => {
          const lastPosition = feature.geometry.coordinates[feature.geometry.coordinates.length - 1];
          const [longitude, latitude] = lastPosition;

          let calculatedCourse = 0;
          if (feature.geometry.coordinates.length >= 2) {
            const prevPosition = feature.geometry.coordinates[feature.geometry.coordinates.length - 2];
            if (prevPosition) {
              calculatedCourse = Math.atan2(
                lastPosition[0] - prevPosition[0],
                lastPosition[1] - prevPosition[1]
              ) * (180 / Math.PI);
              calculatedCourse = (calculatedCourse + 360) % 360;
            }
          }

          return {
            mmsi: feature.properties?.mmsi?.toString() || 'Unknown',
            shipName: feature.properties?.ship_name || 'Unknown',
            shipType: feature.properties?.ship_type?.toString() || 'Unknown',
            aisClass: feature.properties?.ais_class || 'Unknown',
            callsign: feature.properties?.callsign || 'Unknown',
            speed: feature.properties?.speed?.toString() || '0',
            destination: feature.properties?.destination || 'Unknown',
            trueHeading: feature.properties?.true_heading === 511 
              ? calculatedCourse.toString() 
              : feature.properties?.true_heading?.toString() || '0',
            length: feature.properties?.length?.toString() || '0',
            breadth: feature.properties?.breadth?.toString() || '0',
            latitude,
            longitude,
            dateTimeUtc: new Date(feature.properties?.date_time_utc || Date.now()),
            course: calculatedCourse,
            path: feature.geometry.coordinates
          };
        });

      setShips(shipData);
      setLastUpdate(new Date());
      setNextUpdateIn(REFRESH_INTERVAL);
    } catch (error) {
      console.error('Error fetching ship data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ship data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShips();

    const intervalId = setInterval(fetchShips, REFRESH_INTERVAL);

    const countdownId = setInterval(() => {
      setNextUpdateIn(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, [fetchShips]);

  return (
    <div className="h-screen w-full relative">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
          {ships
            .filter(
              (ship) =>
                getHaversineDistance(ship.latitude, ship.longitude, center[0], center[1]) < range
            )
            .map((ship) => (
              <ShipMarker
                key={ship.mmsi}
                ship={ship}
              />
            ))}
        ));
      </MapContainer>
    </div>
  );
};

export default MapComponent;
