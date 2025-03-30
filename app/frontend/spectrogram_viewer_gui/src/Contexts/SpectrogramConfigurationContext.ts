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
    maxFrequency: Math.round(sampleRate / 2),
    minFrequency: 0,
    window: 'hamming',
    narrowbandThreshold: 8,
    windowInMin: 10,
  },
  demonSpectrogramConfiguration: {
    demonSampleFrequency: 200,
    frequencyFilter: 11,
    tperseg: 1,
    maxDb: 15,
    minDb: 0,
    maxFrequency: Math.round(sampleRate / 2),
    minFrequency: 0,
    window: 'hamming',
    windowInMin: 10,
    horizontalFilterLength: 4,
  },
};
