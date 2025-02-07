import React from 'react';

interface SpectrogramContextType {
  spectrogramUrl: string;
  setSpectrogramUrl: React.Dispatch<React.SetStateAction<string>>;
  wavUri: string;
  setWavUri: React.Dispatch<React.SetStateAction<string>>;
}

export const SpectrogramContext = React.createContext<
  SpectrogramContextType | undefined
>(undefined);
