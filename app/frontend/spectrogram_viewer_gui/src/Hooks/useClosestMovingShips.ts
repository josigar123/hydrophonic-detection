import { useMemo } from 'react';
import { getHaversineDistance } from '../utils/distance';
import { useShips } from './useShips';
import { useUserPosition } from './useUserPosition';

export function useClosestMovingShips(isMonitoring = false) {
  const { ships, isLoading } = useShips(isMonitoring);
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
  }, [ships, position]);

  return { closestMovingShips, isLoading };
}
