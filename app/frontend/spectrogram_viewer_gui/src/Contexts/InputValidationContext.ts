import { createContext, Dispatch, SetStateAction } from 'react';

export interface Validity {
  isSpectrogramConfigValid: boolean;
  isBroadbandConfigValid: boolean;
}

interface InputValidationContextType {
  validity: Validity;
  setValidity: Dispatch<SetStateAction<Validity>>;
}

export const ValidityContext = createContext<
  InputValidationContextType | undefined
>(undefined);

export const defaultInputValidity: Validity = {
  isBroadbandConfigValid: false,
  isSpectrogramConfigValid: false,
};
