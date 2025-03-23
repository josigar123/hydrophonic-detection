import { createContext, Dispatch, SetStateAction } from 'react';
import { BroadbandConfiguration } from '../Interfaces/Configuration';

interface BroadbandConfigurationContextType {
  broadbandConfiguration: BroadbandConfiguration;
  setBroadbandConfig: Dispatch<SetStateAction<BroadbandConfiguration>>;
}

export const BroadbandConfigurationContext = createContext<
  BroadbandConfigurationContextType | undefined
>(undefined);

export const defaultBroadbandConfig: BroadbandConfiguration = {
  broadbandThreshold: 0,
  windowSize: 0,
  hilbertWindow: 0,
  bufferLength: 0,
};
