import { createContext, Dispatch, SetStateAction } from 'react';
import { Configuration } from '../Interfaces/Configuration';

interface ConfigurationContextType {
  config: Configuration;
  setConfig: Dispatch<SetStateAction<Configuration>>;
  isConfigValid: (config: Configuration) => boolean;
}

export const ConfigurationContext = createContext<
  ConfigurationContextType | undefined
>(undefined);

// Function for validating that input fields are not null, undefined non-zero and non-empty strings
export const isConfigValid = (config: Configuration): boolean => {
  if (!config) return false;

  const validateField = (field: unknown): boolean => {
    if (field === undefined || field === null) return false;
    if (typeof field === 'string' && field.trim() === '') return false;
    if (typeof field === 'number' && field === 0) return false;
    if (typeof field === 'object' && !Array.isArray(field)) {
      return Object.values(field).every(validateField);
    }
    return true;
  };

  return Object.values(config).every(validateField);
};
