import { createContext } from 'react';

export interface SpectrogramConfiguration {
  tperseg: number;
  frequencyFilter: number;
  horizontalFilterLength: number;
  window: string;
}

export interface DemonSpectrogramConfiguration {
  demonSampleFrequency: number;
  tperseg: number;
  frequencyFilter: number;
  horizontalFilterLength: number;
  window: string;
}

export interface Configuration {
  spectrogramConfiguration: SpectrogramConfiguration;
  demonSpectrogramConfiguration: DemonSpectrogramConfiguration;
  narrowbandThreshold: number;
  broadbandDetectionThreshold: number;
}

interface ConfigurationContextType {
  config: Configuration;
  setConfiguration: (newConfig: Partial<Configuration>) => void;
  isConfigValid: boolean;
}

export const ConfigurationContext = createContext<
  ConfigurationContextType | undefined
>(undefined);
