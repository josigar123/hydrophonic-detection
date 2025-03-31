import { useContext } from 'react';
import UserPositionContext from '../Contexts/UserPositionContext';

export function useUserPosition() {
  const context = useContext(UserPositionContext);
  
  if (context === undefined) {
    throw new Error('useUserPosition must be used within a UserPositionContext.Provider');
  }
  
  return context;
}

export default useUserPosition;