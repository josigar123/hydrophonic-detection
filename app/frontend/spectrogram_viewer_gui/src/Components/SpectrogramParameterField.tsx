import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { useContext, useEffect, useMemo, useState } from 'react';
import { SpectrogramConfiguration } from '../Interfaces/Configuration';
import { validWindowTypes } from '../Interfaces/WindowTypes';
import { SpectrogramConfigurationContext } from '../Contexts/SpectrogramConfigurationContext';

const SpectrogramParameterField = () => {
  const context = useContext(SpectrogramConfigurationContext);

  const useConfiguration = () => {
    if (!context) {
      throw new Error(
        'useConfiguration must be used within a SpectrogramConfigurationProvider'
      );
    }
    return context;
  };

  const { spectrogramConfig, setSpectrogramConfig } = useConfiguration();

  const [localParams, setLocalParams] = useState<SpectrogramConfiguration>({
    tperseg: 0,
    frequencyFilter: 0,
    horizontalFilterLength: 0,
    windowInMin: 0,
    minFrequency: 0,
    maxFrequency: 0,
    minDb: 0,
    maxDb: 0,
    window: '',
    narrowbandThreshold: 0,
  });

  // Sync local state with context on mount
  useEffect(() => {
    if (spectrogramConfig.spectrogramConfiguration) {
      setLocalParams((prev) => ({
        ...prev,
        ...spectrogramConfig.spectrogramConfiguration,
      }));
    }
  }, [spectrogramConfig.spectrogramConfiguration]);

  const handleDropdownChange = (window: string) => {
    setLocalParams((prevParams) => ({
      ...prevParams,
      window,
    }));

    setSpectrogramConfig((prevConfig) => ({
      ...prevConfig,

      spectrogramConfiguration: {
        ...prevConfig.spectrogramConfiguration,
        window,
      },
    }));
  };

  const handleInputChange = (
    field: keyof SpectrogramConfiguration,
    value: string
  ) => {
    const parsedValue = isNaN(Number(value)) ? value : Number(value);
    setLocalParams((prevParams) => ({
      ...prevParams,
      [field]: parsedValue,
    }));

    setSpectrogramConfig((prevConfig) => ({
      ...prevConfig,

      spectrogramConfiguration: {
        ...prevConfig.spectrogramConfiguration,
        [field]: parsedValue,
      },
    }));
  };

  const isTpersegInvalid = useMemo(() => {
    if (localParams.tperseg === 0) return true;

    if (localParams.tperseg >= localParams.horizontalFilterLength) return true;
  }, [localParams.horizontalFilterLength, localParams.tperseg]);

  const validateFilterLength = (value: number) =>
    value % 2 === 0 ? false : true;

  const isFreqFiltInvalid = useMemo(() => {
    if (localParams.frequencyFilter === 0) return true;

    return validateFilterLength(localParams.frequencyFilter) ? false : true;
  }, [localParams.frequencyFilter]);

  return (
    <div className="flex w-full gap-x-4 items-center">
      {/* Dropdown for Window Selection */}
      <div className="flex-1 min-w-0">
        <Dropdown>
          <DropdownTrigger variant="faded">
            <Button className="w-full h-12 hover:bg-gray-200 truncate">
              {localParams?.window || 'Select window type'}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            selectionMode="single"
            aria-label="Window"
            onAction={(window) => handleDropdownChange(window.toString())}
          >
            {validWindowTypes.map((window) => (
              <DropdownItem key={window}>{window}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Input Fields */}
      <Input
        labelPlacement="inside"
        label="tperseg"
        className="flex-1 min-w-0 h-12"
        errorMessage="Value must be less horizontal filter and non-zero"
        isInvalid={isTpersegInvalid}
        value={localParams?.tperseg.toString() || ''}
        onChange={(e) => handleInputChange('tperseg', e.target.value)}
      />
      <Input
        labelPlacement="inside"
        label="freqFilt"
        className="flex-1 min-w-0 h-12"
        errorMessage="Value must be odd and non-zero"
        isInvalid={isFreqFiltInvalid}
        value={localParams?.frequencyFilter.toString() || ''}
        onChange={(e) => handleInputChange('frequencyFilter', e.target.value)}
      />
      <Input
        labelPlacement="inside"
        label="hfiltLength"
        className="flex-1 min-w-0 h-12"
        value={localParams?.horizontalFilterLength.toString() || ''}
        onChange={(e) =>
          handleInputChange('horizontalFilterLength', e.target.value)
        }
      />
      <Input
        labelPlacement="inside"
        label="windowInMin"
        className="flex-1 min-w-0 h-12"
        value={localParams?.windowInMin.toString() || ''}
        onChange={(e) => handleInputChange('windowInMin', e.target.value)}
      ></Input>
      <Input
        labelPlacement="inside"
        label="maxFrequency"
        className="flex-1 min-w-0 h-12"
        value={localParams?.maxFrequency.toString() || ''}
        onChange={(e) => handleInputChange('maxFrequency', e.target.value)}
      ></Input>
      <Input
        labelPlacement="inside"
        label="minFrequency"
        className="flex-1 min-w-0 h-12"
        value={localParams?.minFrequency.toString() || ''}
        onChange={(e) => handleInputChange('minFrequency', e.target.value)}
      ></Input>
      <Input
        labelPlacement="inside"
        label="maxDb"
        className="flex-1 min-w-0 h-12"
        value={localParams?.maxDb.toString() || ''}
        onChange={(e) => handleInputChange('maxDb', e.target.value)}
      ></Input>
      <Input
        labelPlacement="inside"
        label="minDb"
        className="flex-1 min-w-0 h-12"
        value={localParams?.minDb.toString() || ''}
        onChange={(e) => handleInputChange('minDb', e.target.value)}
      ></Input>
      <Input
        labelPlacement="inside"
        label="narrowbandThreshold"
        className="flex-1 min-w-0 h-12"
        value={localParams?.narrowbandThreshold.toString() || ''}
        onChange={(e) =>
          handleInputChange('narrowbandThreshold', e.target.value)
        }
      ></Input>
    </div>
  );
};

export default SpectrogramParameterField;
