import axios from 'axios';
import { Ship } from '../Components/ShipMarker';

const AIS_API_URL = 'https://kystdatahuset.no/ws/api/ais/realtime/geojson';

export const fetchAisData = async (): Promise<Ship[]> => {
  const response = await axios.get(AIS_API_URL);
  const features = response.data.features;

  if (!Array.isArray(features)) {
    throw new Error('Invalid data format received');
  }

  const ships: Ship[] = features
    .filter((feature) => {
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
    .map((feature) => {
      const coords = feature.geometry.coordinates;
      const lastPosition = coords[coords.length - 1];
      const [longitude, latitude] = lastPosition;

      let calculatedCourse = 0;
      if (coords.length >= 2) {
        const prevPosition = coords[coords.length - 2];
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
        path: feature.geometry.coordinates,
      };
    });

  return ships;
};
