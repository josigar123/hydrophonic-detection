import React from 'react';

interface SpectrogramContextType {
  spectrogramURI: string;
  setSpectrogramURI: React.Dispatch<React.SetStateAction<string>>;
}

export const SpectrogramContext = React.createContext<
  SpectrogramContextType | undefined
>(undefined);
