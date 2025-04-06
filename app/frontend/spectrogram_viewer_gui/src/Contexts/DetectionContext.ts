import { createContext, Dispatch, SetStateAction } from 'react';

export interface Detection {
  broadbandDetection: boolean;
  narrowbandDetection: boolean;
}

interface DetectionContextType {
  detection: Detection;
  setDetection: Dispatch<SetStateAction<Detection>>;
}

export const DetectionContext = createContext<DetectionContextType | undefined>(
  undefined
);
