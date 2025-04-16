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
    frequencyFilter: 11,
    horizontalFilterLength: 4,
    maxDb: 15,
    minDb: 0,
    maxFrequency: 1000,
    minFrequency: 0,
    window: 'hann',
    narrowbandThreshold: 8,
    windowInMin: 10,
  },
  demonSpectrogramConfiguration: {
    demonSampleFrequency: 300,
    frequencyFilter: 13,
    tperseg: 2,
    maxDb: 5,
    minDb: 0,
    maxFrequency: 150,
    minFrequency: 0,
    window: 'hann',
    windowInMin: 3,
    horizontalFilterLength: 4,
  },
  scotConfiguration: {
    channel1: 1,
    channel2: 1,
    correlationLength: 512,
    windowInMin: 2,
    refreshRateInSeconds: 10,
  },
};
