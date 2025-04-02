import { createContext, Dispatch, SetStateAction } from 'react';

export interface Position {
  latitude: number;
  longitude: number;
}

interface UserPositionContextType {
  position: Position;
  setPosition: Dispatch<SetStateAction<Position>>;
}

const UserPositionContext = createContext<
  UserPositionContextType | undefined
>(undefined);

export const defaultPosition: Position = {
  latitude: 59.412598788251344,
  longitude: 10.4901256300511
};

export default UserPositionContext;