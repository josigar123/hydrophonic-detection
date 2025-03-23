import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { useContext, useEffect, useState } from 'react';
import { DemonSpectrogramConfiguration } from '../Interfaces/Configuration';
import { validWindowTypes } from '../Interfaces/WindowTypes';
import { SpectrogramConfigurationContext } from '../Contexts/SpectrogramConfigurationContext';

const DemonSpectrogramParameterField = () => {
  const context = useContext(SpectrogramConfigurationContext);

  const useConfiguration = () => {
    if (!context) {
      throw new Error(
        'useConfiguration must be used within a ConfigurationProvider'
      );
    }
    return context;
  };

  const { spectrogramConfig, setSpectrogramConfig } = useConfiguration();

  const [localParams, setLocalParams] = useState<DemonSpectrogramConfiguration>(
    {
      demonSampleFrequency: 0,
      tperseg: 0,
      frequencyFilter: 0,
      horizontalFilterLength: 0,
      windowInMin: 0,
      minFrequency: 0,
      maxFrequency: 0,
      minDb: 0,
      maxDb: 0,
      window: '',
    }
  );

  // Sync local state with context on mount
  useEffect(() => {
    if (spectrogramConfig.demonSpectrogramConfiguration) {
      setLocalParams((prev) => ({
        ...prev,
        ...spectrogramConfig.demonSpectrogramConfiguration,
      }));
    }
  }, [spectrogramConfig.demonSpectrogramConfiguration]);

  const handleDropdownChange = (window: string) => {
    setLocalParams((prevParams) => ({
      ...prevParams,
      window,
    }));

    setSpectrogramConfig((prevConfig) => ({
      ...prevConfig,
      config: {
        ...prevConfig,
        demonSpectrogramConfiguration: {
          ...prevConfig.demonSpectrogramConfiguration,
          window,
        },
      },
    }));
  };

  const handleInputChange = (
    field: keyof DemonSpectrogramConfiguration,
    value: string
  ) => {
    const parsedValue = isNaN(Number(value)) ? value : Number(value);
    setLocalParams((prevParams) => ({
      ...prevParams,
      [field]: parsedValue,
    }));

    setSpectrogramConfig((prevConfig) => ({
      ...prevConfig,
      config: {
        ...prevConfig,
        demonSpectrogramConfiguration: {
          ...prevConfig.demonSpectrogramConfiguration,
          [field]: parsedValue,
        },
      },
    }));
  };

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
        label="DEMON sample frequency"
        className="flex-1 min-w-0 h-12"
        isRequired
        value={localParams?.demonSampleFrequency.toString() || ''}
        onChange={(e) =>
          handleInputChange('demonSampleFrequency', e.target.value)
        }
      />
      <Input
        labelPlacement="inside"
        label="Time per segment"
        className="flex-1 min-w-0 h-12"
        isRequired
        value={localParams?.tperseg.toString() || ''}
        onChange={(e) => handleInputChange('tperseg', e.target.value)}
      />
      <Input
        labelPlacement="inside"
        label="Frequency filter"
        className="flex-1 min-w-0 h-12"
        isRequired
        value={localParams?.frequencyFilter.toString() || ''}
        onChange={(e) => handleInputChange('frequencyFilter', e.target.value)}
      />
      <Input
        labelPlacement="inside"
        label="Horizontal filter"
        className="flex-1 min-w-0 h-12"
        isRequired
        value={localParams?.horizontalFilterLength.toString() || ''}
        onChange={(e) =>
          handleInputChange('horizontalFilterLength', e.target.value)
        }
      />
      <Input
        labelPlacement="inside"
        label="Window in mins"
        className="flex-1 min-w-0 h-12"
        isRequired
        value={localParams?.windowInMin.toString() || ''}
        onChange={(e) => handleInputChange('windowInMin', e.target.value)}
      ></Input>
      <Input
        labelPlacement="inside"
        label="Max frequency"
        className="flex-1 min-w-0 h-12"
        isRequired
        value={localParams?.maxFrequency.toString() || ''}
        onChange={(e) => handleInputChange('maxFrequency', e.target.value)}
      ></Input>
      <Input
        labelPlacement="inside"
        label="Min frequency"
        className="flex-1 min-w-0 h-12"
        isRequired
        value={localParams?.minFrequency.toString() || ''}
        onChange={(e) => handleInputChange('minFrequency', e.target.value)}
      ></Input>
      <Input
        labelPlacement="inside"
        label="max Db"
        className="flex-1 min-w-0 h-12"
        value={localParams?.maxDb.toString() || ''}
        onChange={(e) => handleInputChange('maxDb', e.target.value)}
      ></Input>
      <Input
        labelPlacement="inside"
        label="min Db"
        className="flex-1 min-w-0 h-12"
        isRequired
        value={localParams?.minDb.toString() || ''}
        onChange={(e) => handleInputChange('minDb', e.target.value)}
      ></Input>
    </div>
  );
};

export default DemonSpectrogramParameterField;
