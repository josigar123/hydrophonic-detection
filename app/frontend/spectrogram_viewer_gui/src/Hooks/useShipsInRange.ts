import { useMemo } from 'react';
import { Ship } from '../Components/ShipMarker';
import { useShips } from './useShips';
import { useUserPosition } from './useUserPosition';
import { getHaversineDistance } from '../Utils/distance';

const MAX_RANGE = 200; // km

export function useShipsInRange() {
  const { position } = useUserPosition();
  const { ships, isLoading } = useShips();
  
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