import { useEffect } from "react";
import { Ship } from "./ShipMarker";

const AIS_API_URL = "https://kystdatahuset.no/ws/api/ais/realtime/geojson";

const fetchAisData = async () => {
    try {
      const results = await fetch(AIS_API_URL);
      if (!results.ok) throw new Error("Failed to fetch AIS data");

      const json = await results.json();

      const parsedShips: Ship[] = json.features
        .map((feature: any) => {
          if (
            !feature.geometry ||
            !feature.geometry.coordinates ||
            feature.geometry.coordinates.length === 0 ||
            !Array.isArray(feature.geometry.coordinates[0])
          ) {
            console.warn("Missing or invalid geometry:", feature);
            return null;
          }

          const mostRecentPositionIndex = feature.geometry.coordinates.length - 1;
          const mostRecentPosition = feature.geometry.coordinates[mostRecentPositionIndex];

          return {
            MMSI: feature.properties.mmsi,
            STATUS: feature.properties.status, 
            LATITUDE: mostRecentPosition[1], 
            LONGITUDE: mostRecentPosition[0],
            SHIP_NAME: feature.properties.ship_name,

          };
        })
        .filter((ship) => ship !== null)
        // .slice(0, MAX_SHIPS); // Denne må være slik at den slicer x antall nærmeste skip. 
    } catch (error) {
      console.error("Error fetching AIS data:", error);
    }
  };
  useEffect(() => {
    fetchAisData();
    const interval = setInterval(fetchAisData, 10000);

    return () => clearInterval(interval);
  }, []);

  export default AisFetch;
