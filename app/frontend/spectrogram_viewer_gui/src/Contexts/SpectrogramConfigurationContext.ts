import { createContext, Dispatch, SetStateAction } from 'react';
import { SpectrogramNarrowbandAndDemonConfiguration } from '../Interfaces/Configuration';
import recordingConfig from '../../../../configs/recording_parameters.json';
interface SpectrogramConfigurationContextType {
  spectrogramConfig: SpectrogramNarrowbandAndDemonConfiguration;
  setSpectrogramConfig: Dispatch<
    SetStateAction<SpectrogramNarrowbandAndDemonConfiguration>
  >;
}

const sampleRate = recordingConfig['sampleRate'];

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
    maxFrequency: 2000,
    minFrequency: 0,
    window: 'hann',
    narrowbandThreshold: 8,
    windowInMin: 10,
  },
  demonSpectrogramConfiguration: {
    demonSampleFrequency: 1000,
    frequencyFilter: 13,
    tperseg: 2,
    maxDb: 12,
    minDb: 0,
    maxFrequency: 500 ,
    minFrequency: 0,
    window: 'hann',
    windowInMin: 3,
    horizontalFilterLength: 4,
  },
};
