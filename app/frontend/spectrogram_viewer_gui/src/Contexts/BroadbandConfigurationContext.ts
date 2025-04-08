import { createContext, Dispatch, SetStateAction } from 'react';
import { BroadbandConfiguration } from '../Interfaces/Configuration';

interface BroadbandConfigurationContextType {
  broadbandConfiguration: BroadbandConfiguration;
  setBroadbandConfig: Dispatch<SetStateAction<BroadbandConfiguration>>;
}

export const BroadbandConfigurationContext = createContext<
  BroadbandConfigurationContextType | undefined
>(undefined);

export const defaultBroadbandConfig: BroadbandConfiguration = {};

export const broadbandPreset1: BroadbandConfiguration = {
  broadbandThreshold: 8,
  windowSize: 5,
  bufferLength: 300,
  hilbertWindow: 15,
  windowInMin: 5,
};
