import { useCallback } from 'react';
import { useUserPosition } from './useUserPosition';

export function useMapInteraction(sendPosition?: () => void) {
  const { position, setPosition } = useUserPosition();
  
  const handlePositionChange = useCallback((lat: number, lng: number) => {
    setPosition({ latitude: lat, longitude: lng });
    
    if (sendPosition) {
      sendPosition();
    }
  }, [setPosition, sendPosition]);
  
  return { position, handlePositionChange };
}