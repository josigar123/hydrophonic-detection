import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { useContext, useState, useCallback, useRef, useEffect } from 'react';
import { validWindowTypes } from '../Interfaces/WindowTypes';
import { SpectrogramConfigurationContext } from '../Contexts/SpectrogramConfigurationContext';

interface DemonSpectrogramParameterFieldProps {
  isConnected: boolean;
}

const DemonSpectrogramParameterField = ({
  isConnected,
}: DemonSpectrogramParameterFieldProps) => {
  const context = useContext(SpectrogramConfigurationContext);

  if (!context) {
    throw new Error(
      'DemonSpectrogramParameterField must be used within a SpectrogramConfigurationProvider'
    );
  }

  const { spectrogramConfig, setSpectrogramConfig } = context;
  const demonConfig = spectrogramConfig.demonSpectrogramConfiguration || {};

  const [inputValues, setInputValues] = useState({
    window: demonConfig.window || '',
    demonSampleFrequency: demonConfig.demonSampleFrequency?.toString() || '',
    tperseg: demonConfig.tperseg?.toString() || '',
    frequencyFilter: demonConfig.frequencyFilter?.toString() || '',
    horizontalFilterLength:
      demonConfig.horizontalFilterLength?.toString() || '',
    windowInMin: demonConfig.windowInMin?.toString() || '',
    maxFrequency: demonConfig.maxFrequency?.toString() || '',
    minFrequency: demonConfig.minFrequency?.toString() || '',
    maxDb: demonConfig.maxDb?.toString() || '',
    minDb: demonConfig.minDb?.toString() || '',
  });

  // Use a ref to track if we need to commit changes
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input changes immediately for UI responsiveness
  const handleInputChange = useCallback(
    (field: keyof typeof inputValues, value: string) => {
      // Update local state immediately for responsive UI
      setInputValues((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        setSpectrogramConfig((prevConfig) => {
          const parsedValue = isNaN(Number(value)) ? value : Number(value);
          return {
            ...prevConfig,
            demonSpectrogramConfiguration: {
              ...prevConfig.demonSpectrogramConfiguration,
              [field]: parsedValue,
            },
          };
        });
      }, 300); // 300ms debounce
    },
    [setSpectrogramConfig]
  );

  // Handle blur to ensure value is committed when field loses focus
  const handleBlur = useCallback(
    (field: keyof typeof inputValues) => {
      const value = inputValues[field];
      const parsedValue = isNaN(Number(value)) ? value : Number(value);

      setSpectrogramConfig((prevConfig) => ({
        ...prevConfig,
        demonSpectrogramConfiguration: {
          ...prevConfig.demonSpectrogramConfiguration,
          [field]: parsedValue,
        },
      }));

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    },
    [inputValues, setSpectrogramConfig]
  );

  // Handle dropdown selection
  const handleDropdownChange = useCallback(
    (window: string) => {
      // Update local state
      setInputValues((prev) => ({
        ...prev,
        window,
      }));

      // Update context immediately for dropdown
      setSpectrogramConfig((prevConfig) => ({
        ...prevConfig,
        demonSpectrogramConfiguration: {
          ...prevConfig.demonSpectrogramConfiguration,
          window,
        },
      }));
    },
    [setSpectrogramConfig]
  );

  // Effect for updating fields, when context changes e.g when a preset is selected
  useEffect(() => {
    setInputValues({
      demonSampleFrequency:
        spectrogramConfig.demonSpectrogramConfiguration?.demonSampleFrequency?.toString() ||
        '',
      window: spectrogramConfig.demonSpectrogramConfiguration?.window || '',
      tperseg:
        spectrogramConfig.demonSpectrogramConfiguration?.tperseg?.toString() ||
        '',
      frequencyFilter:
        spectrogramConfig.demonSpectrogramConfiguration?.frequencyFilter?.toString() ||
        '',
      horizontalFilterLength:
        spectrogramConfig.demonSpectrogramConfiguration?.horizontalFilterLength?.toString() ||
        '',
      windowInMin:
        spectrogramConfig.demonSpectrogramConfiguration?.windowInMin?.toString() ||
        '',
      maxFrequency:
        spectrogramConfig.demonSpectrogramConfiguration?.maxFrequency?.toString() ||
        '',
      minFrequency:
        spectrogramConfig.demonSpectrogramConfiguration?.minFrequency?.toString() ||
        '',
      maxDb:
        spectrogramConfig.demonSpectrogramConfiguration?.maxDb?.toString() ||
        '',
      minDb:
        spectrogramConfig.demonSpectrogramConfiguration?.minDb?.toString() ||
        '',
    });
  }, [spectrogramConfig]);

  return (
    <div className="flex w-full gap-x-4 items-center">
      {/* Dropdown for Window Selection */}
      <div className="flex-1 min-w-0">
        <Dropdown>
          <DropdownTrigger variant="faded">
            <Button
              isDisabled={isConnected}
              className={`w-full h-12 hover:bg-gray-200 truncate ${
                isConnected ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {inputValues.window || 'Select window'}
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
        label="demonFs"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[Hz]</span>
          </div>
        }
        isDisabled={isConnected}
        value={inputValues.demonSampleFrequency}
        onChange={(e) =>
          handleInputChange('demonSampleFrequency', e.target.value)
        }
        onBlur={() => handleBlur('demonSampleFrequency')}
      />
      <Input
        labelPlacement="inside"
        label="tperseg"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[s]</span>
          </div>
        }
        isDisabled={isConnected}
        value={inputValues.tperseg}
        onChange={(e) => handleInputChange('tperseg', e.target.value)}
        onBlur={() => handleBlur('tperseg')}
      />
      <Input
        labelPlacement="inside"
        label="freqFilt"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[fBins]</span>
          </div>
        }
        isDisabled={isConnected}
        value={inputValues.frequencyFilter}
        onChange={(e) => handleInputChange('frequencyFilter', e.target.value)}
        onBlur={() => handleBlur('frequencyFilter')}
      />
      <Input
        labelPlacement="inside"
        label="hfilt"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[s]</span>
          </div>
        }
        isDisabled={isConnected}
        value={inputValues.horizontalFilterLength}
        onChange={(e) =>
          handleInputChange('horizontalFilterLength', e.target.value)
        }
        onBlur={() => handleBlur('horizontalFilterLength')}
      />
      <Input
        labelPlacement="inside"
        label="windowLen"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[min]</span>
          </div>
        }
        isDisabled={isConnected}
        value={inputValues.windowInMin}
        onChange={(e) => handleInputChange('windowInMin', e.target.value)}
        onBlur={() => handleBlur('windowInMin')}
      />
      <Input
        labelPlacement="inside"
        label="maxFreq"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        isDisabled={isConnected}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[Hz]</span>
          </div>
        }
        value={inputValues.maxFrequency}
        onChange={(e) => handleInputChange('maxFrequency', e.target.value)}
        onBlur={() => handleBlur('maxFrequency')}
      />
      <Input
        labelPlacement="inside"
        label="minFreq"
        isDisabled={isConnected}
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[Hz]</span>
          </div>
        }
        value={inputValues.minFrequency}
        onChange={(e) => handleInputChange('minFrequency', e.target.value)}
        onBlur={() => handleBlur('minFrequency')}
      />
      <Input
        labelPlacement="inside"
        label="maxDb"
        isDisabled={isConnected}
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[Db]</span>
          </div>
        }
        value={inputValues.maxDb}
        onChange={(e) => handleInputChange('maxDb', e.target.value)}
        onBlur={() => handleBlur('maxDb')}
      />
      <Input
        labelPlacement="inside"
        label="minDb"
        isDisabled={isConnected}
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[dB]</span>
          </div>
        }
        value={inputValues.minDb}
        onChange={(e) => handleInputChange('minDb', e.target.value)}
        onBlur={() => handleBlur('minDb')}
      />
    </div>
  );
};

export default DemonSpectrogramParameterField;
