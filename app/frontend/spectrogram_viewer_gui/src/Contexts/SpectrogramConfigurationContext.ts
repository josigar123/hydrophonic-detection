import { createContext, Dispatch, SetStateAction } from 'react';
import { SpectrogramNarrowbandAndDemonConfiguration } from '../Interfaces/Configuration';

interface SpectrogramConfigurationContextType {
  spectrogramConfig: SpectrogramNarrowbandAndDemonConfiguration;
  setSpectrogramConfig: Dispatch<
    SetStateAction<SpectrogramNarrowbandAndDemonConfiguration>
  >;
}

export const SpectrogramConfigurationContext = createContext<
  SpectrogramConfigurationContextType | undefined
>(undefined);

export const defaultSpectrogramConfig: SpectrogramNarrowbandAndDemonConfiguration =
  {};

export const parameterPreset1: SpectrogramNarrowbandAndDemonConfiguration = {
  spectrogramConfiguration: {
    tperseg: 1,
    frequencyFilter: 13,
    horizontalFilterLength: 20,
    maxDb: 15,
    minDb: 0,
    maxFrequency: 1000,
    minFrequency: 0,
    window: 'hann',
    narrowbandThreshold: 8,
    windowInMin: 5,
  },
  demonSpectrogramConfiguration: {
    demonSampleFrequency: 600,
    frequencyFilter: 13,
    tperseg: 1,
    maxDb: 8,
    minDb: 0,
    maxFrequency: 300,
    minFrequency: 0,
    window: 'hann',
    windowInMin: 5,
    horizontalFilterLength: 20,
  },
};
