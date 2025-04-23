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
  broadbandThreshold: 7,
  windowSize: 13,
  bufferLength: 900,
  hilbertWindow: 50,
  windowLength: 15,
};
