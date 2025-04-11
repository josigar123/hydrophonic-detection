import { createContext, Dispatch, SetStateAction } from 'react';
import { BroadbandDetections } from '../Interfaces/Payloads';

export interface Detection {
  broadbandDetections: BroadbandDetections;
  narrowbandDetection: boolean;
}

interface DetectionContextType {
  detection: Detection;
  setDetection: Dispatch<SetStateAction<Detection>>;
}

export const DetectionContext = createContext<DetectionContextType | undefined>(
  undefined
);
