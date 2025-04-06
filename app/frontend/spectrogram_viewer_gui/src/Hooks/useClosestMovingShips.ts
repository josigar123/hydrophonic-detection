import { useMemo } from 'react';
import { getHaversineDistance } from '../utils/distance';
import { useShips } from './useShips';
import { useUserPosition } from './useUserPosition';

const MAX_SHIPS = 40;

export function useClosestMovingShips() {
  const { ships, isLoading } = useShips();
  const { position } = useUserPosition();

  const closestMovingShips = useMemo(() => {
    return ships
      .filter((ship) => parseFloat(ship.speed) > 0.5)
      .map((ship) => ({
        ...ship,
        distance: getHaversineDistance(
          ship.latitude,
          ship.longitude,
          position.latitude,
          position.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_SHIPS);
  }, [ships, position]);

  return { closestMovingShips, isLoading };
}
