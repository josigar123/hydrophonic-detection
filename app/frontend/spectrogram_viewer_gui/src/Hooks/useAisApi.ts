import { useState, useEffect, useCallback } from 'react';
import { Ship } from '../Components/ShipMarker';
import { fetchAisData } from '../Api/aisApi';

const REFRESH_INTERVAL = 10000;

export const useShips = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextUpdateIn, setNextUpdateIn] = useState(REFRESH_INTERVAL);

  const deduplicateShips = (shipData: Ship[]): Ship[] => {
    const uniqueShipsMap = new Map<number | string, Ship>();
    
    shipData.forEach(ship => {
      const mmsi = ship.mmsi;
      
      if (!uniqueShipsMap.has(mmsi)) {
        uniqueShipsMap.set(mmsi, ship);
        return;
      }
      
      const existingShip = uniqueShipsMap.get(mmsi)!;
      
      if (ship.dateTimeUtc && existingShip.dateTimeUtc) {
        if (ship.dateTimeUtc > existingShip.dateTimeUtc) {
          uniqueShipsMap.set(mmsi, ship);
        }
      } else {
        uniqueShipsMap.set(mmsi, ship);
      }
    });
  
    return Array.from(uniqueShipsMap.values());
  };

  const fetchShips = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await fetchAisData();
      const uniqueShips = deduplicateShips(data);
      setShips(uniqueShips);
      
      setLastUpdate(new Date());
      setNextUpdateIn(REFRESH_INTERVAL);
    }
    catch (error) {
      console.error('Error fetching ship data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ship data');
    }
    finally {
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

  return { ships, isLoading, lastUpdate, error, nextUpdateIn };
};