import { useState, useEffect } from 'react';
import { Ship } from '../Components/ShipMarker';
import { useDataSource } from '../Hooks/useDataSource';
import shipStore, { useAisStreamWithSource } from './useAisStream';
import { useShips as useApiShips } from './useAisApi';

interface UseShipsResult {
  ships: Ship[];
  isLoading: boolean;
  lastUpdate: Date | null;
  error?: string | null;
  nextUpdateIn?: number;
}

export const useShips = (isMonitoring = false): UseShipsResult => {
  const { dataSource } = useDataSource();
  const [antennaShips, setAntennaShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Pass isMonitoring to use in useAisStreamWithSource
  useAisStreamWithSource(isMonitoring);
  
  const apiShipsResult = useApiShips();
  
  useEffect(() => {
    if (dataSource === 'antenna') {
      setAntennaShips(shipStore.getShips());
      setIsLoading(false);
      setLastUpdate(new Date());
      
      // Only connect if we're monitoring
      if (isMonitoring) {
        const unsubscribe = shipStore.subscribe((updatedShips) => {
          setAntennaShips(updatedShips);
          setLastUpdate(new Date());
          setIsLoading(false);
        });
        
        return () => {
          unsubscribe();
        };
      }
    }
  }, [dataSource, isMonitoring]);

  // Return appropriate data based on selected source
  if (dataSource === 'antenna') {
    return {
      ships: antennaShips,
      isLoading,
      lastUpdate,
      error: null,
      nextUpdateIn: undefined
    };
  } else {
    return {
      ships: apiShipsResult.ships,
      isLoading: apiShipsResult.isLoading,
      lastUpdate: apiShipsResult.lastUpdate,
      error: apiShipsResult.error,
      nextUpdateIn: apiShipsResult.nextUpdateIn
    };
  }
};

export default useShips;