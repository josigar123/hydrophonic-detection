import { useUserPosition } from './useUserPosition';

export function useMapInteraction() {
  const { position, setPosition } = useUserPosition();
  
  const handlePositionChange = (lat: number, lng: number) => {
    setPosition({ latitude: lat, longitude: lng });
  };
  
  return { position, handlePositionChange };
}