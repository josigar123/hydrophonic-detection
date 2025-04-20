import { useEffect, useState } from 'react';
import { Ship } from '../Components/ShipMarker';
import { useDataSource } from '../Hooks/useDataSource';
import shipStore, { useAisStreamWithSource } from './useAisStream';

interface UseShipsResult {
  ships: Ship[];
  isLoading: boolean;
  lastUpdate: Date | null;
}
export const useShips = (isMonitoring = false): UseShipsResult => {
  const { dataSource } = useDataSource();
  const [ships, setShips] = useState<Ship[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [lastUpdate, setStamp] = useState<Date | null>(null);

  // Opens / closes the WebSocket and switches feed when the context changes
  useAisStreamWithSource(isMonitoring);

  // Subscribe to the shipStore whenever monitoring is on
  useEffect(() => {
    setShips(shipStore.getShips());
    setLoading(false);
    setStamp(new Date());

    // Live updates only when monitoring is enabled
    if (!isMonitoring) return;

    const unsubscribe = shipStore.subscribe(updated => {
      setShips(updated);
      setStamp(new Date());
    });

    return unsubscribe;
  }, [dataSource, isMonitoring]);

  return { ships, isLoading, lastUpdate };
};

export default useShips;