import { useState, useEffect } from 'react';
import { Ship } from '../Components/ShipMarker';
import shipStore from './useAisStream';

interface UseShipsResult {
  ships: Ship[];
  isLoading: boolean;
  lastUpdate: Date | null;
}

export const useShips = (): UseShipsResult => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  useEffect(() => {
    setShips(shipStore.getShips());
    setIsLoading(false);
    
    const unsubscribe = shipStore.subscribe((updatedShips) => {
      setShips(updatedShips);
      setLastUpdate(new Date());
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  return {
    ships,
    isLoading,
    lastUpdate
  };
};

export default useShips;