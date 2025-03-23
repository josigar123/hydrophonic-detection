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
  {
    spectrogramConfiguration: {
      tperseg: 0,
      frequencyFilter: 0,
      horizontalFilterLength: 0,
      window: '',
      windowInMin: 0,
      maxFrequency: 0,
      minFrequency: 0,
      maxDb: 0,
      minDb: 0,
      narrowbandThreshold: 0,
    },
    demonSpectrogramConfiguration: {
      demonSampleFrequency: 0,
      tperseg: 0,
      frequencyFilter: 0,
      horizontalFilterLength: 0,
      window: '',
      windowInMin: 0,
      maxFrequency: 0,
      minFrequency: 0,
      maxDb: 0,
      minDb: 0,
    },
  };
