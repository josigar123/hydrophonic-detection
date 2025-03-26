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
