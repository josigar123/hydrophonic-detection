import { useMemo } from 'react';
import { Ship } from '../Components/ShipMarker';
import { useShips } from './useShips';
import { useUserPosition } from './useUserPosition';
import { getHaversineDistance } from '../utils/distance';

const MAX_RANGE = 50; // km

export function useShipsInRange(isMonitoring = false)  {
  const { position } = useUserPosition();
  const { ships, isLoading } = useShips(isMonitoring);


  const shipsInRange = useMemo(() => {
    return ships.filter(
      (ship: Ship) =>
        getHaversineDistance(
          ship.latitude,
          ship.longitude,
          position.latitude,
          position.longitude
        ) < MAX_RANGE
    );
  }, [ships, position]);

  return { shipsInRange, isLoading };
}
