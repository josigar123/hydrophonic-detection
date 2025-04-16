import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { useContext, useCallback, useState, useRef, useEffect } from 'react';
import { SpectrogramConfigurationContext } from '../Contexts/SpectrogramConfigurationContext';
import recordinParameters from '../../../../configs/recording_parameters.json';

const numChannels = recordinParameters['channels'];

interface CrossCorrelationParameterFieldProps {
  isConnected: boolean;
}

const CrossCorrelationParameterField = ({
  isConnected,
}: CrossCorrelationParameterFieldProps) => {
  const context = useContext(SpectrogramConfigurationContext);

  if (!context) {
    throw new Error(
      'SpectrogramParameterField must be used within a SpectrogramConfigurationProvider'
    );
  }

  const { spectrogramConfig, setSpectrogramConfig } = context;
  const config = spectrogramConfig.scotConfiguration || {};

  // Use local state only for input values
  const [inputValues, setInputValues] = useState({
    channel1: config.channel1?.toString() || '',
    channel2: config.channel2?.toString() || '',
    windowInMin: config.windowInMin?.toString() || '',
    correlationLength: config.correlationLength?.toString() || '',
    refreshRateInSeconds: config.refreshRateInSeconds?.toString() || '',
  });

  // Use a ref to track if we need to commit changes
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDropDownChangeForChannel1 = useCallback(
    (channel1: string) => {
      const ch1 = Number.parseInt(channel1) + 1;
      setInputValues((prev) => ({
        ...prev,
        channel1: ch1.toString(),
      }));

      setSpectrogramConfig((prevConfig) => ({
        ...prevConfig,
        scotConfiguration: {
          ...prevConfig.scotConfiguration,
          channel1: ch1,
        },
      }));
    },
    [setSpectrogramConfig]
  );

  const handleDropDownChangeForChannel2 = useCallback(
    (channel2: string) => {
      const ch2 = Number.parseInt(channel2) + 1;

      setInputValues((prev) => ({
        ...prev,
        channel2: ch2.toString(),
      }));

      setSpectrogramConfig((prevConfig) => ({
        ...prevConfig,
        scotConfiguration: {
          ...prevConfig.scotConfiguration,
          channel2: ch2,
        },
      }));
    },
    [setSpectrogramConfig]
  );

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
            scotConfiguration: {
              ...prevConfig.scotConfiguration,
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
        scotConfiguration: {
          ...prevConfig.scotConfiguration,
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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Effect for updating fields, when context changes e.g when a preset is selected
  useEffect(() => {
    setInputValues({
      channel1: spectrogramConfig.scotConfiguration?.channel1?.toString() || '',
      channel2: spectrogramConfig.scotConfiguration?.channel2?.toString() || '',
      windowInMin:
        spectrogramConfig.scotConfiguration?.windowInMin?.toString() || '',
      correlationLength:
        spectrogramConfig.scotConfiguration?.correlationLength?.toString() ||
        '',
      refreshRateInSeconds:
        spectrogramConfig?.scotConfiguration?.refreshRateInSeconds?.toString() ||
        '',
    });
  }, [spectrogramConfig]);

  return (
    <div className="flex w-full gap-x-4 items-center">
      {/* Dropdowns */}
      <div className="flex-1 min-w-0">
        <Dropdown>
          <DropdownTrigger variant="faded">
            <Button
              isDisabled={isConnected}
              className={`w-full h-12 hover:bg-gray-200 truncate ${
                isConnected ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {inputValues.channel1
                ? 'Channel ' + inputValues.channel1
                : 'Select channel'}
            </Button>
          </DropdownTrigger>

          <DropdownMenu
            disallowEmptySelection
            selectionMode="single"
            aria-label="Channel1"
            onAction={(key) => handleDropDownChangeForChannel1(key.toString())}
          >
            {[...Array(numChannels)].map((_, i) => (
              <DropdownItem key={i}>{`Channel ${i + 1}`}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="flex-1 min-w-0">
        <Dropdown>
          <DropdownTrigger variant="faded">
            <Button
              isDisabled={isConnected}
              className={`w-full h-12 hover:bg-gray-200 truncate ${
                isConnected ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {inputValues.channel2
                ? 'Channel ' + inputValues.channel2
                : 'Select channel'}
            </Button>
          </DropdownTrigger>

          <DropdownMenu
            disallowEmptySelection
            selectionMode="single"
            aria-label="Channel2"
            onAction={(key) => handleDropDownChangeForChannel2(key.toString())}
          >
            {[...Array(numChannels)].map((_, i) => (
              <DropdownItem key={i}>{`Channel ${i + 1}`}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Input Fields */}
      <Input
        labelPlacement="inside"
        label="correlationLength"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        errorMessage="Value must be odd and non-zero"
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[S]</span>
          </div>
        }
        isDisabled={isConnected}
        value={inputValues.correlationLength}
        onChange={(e) => handleInputChange('correlationLength', e.target.value)}
        onBlur={() => handleBlur('correlationLength')}
      />

      <Input
        labelPlacement="inside"
        label="refreshRate"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[s]</span>
          </div>
        }
        value={inputValues.refreshRateInSeconds}
        isDisabled={isConnected}
        onChange={(e) =>
          handleInputChange('refreshRateInSeconds', e.target.value)
        }
        onBlur={() => handleBlur('refreshRateInSeconds')}
      />
      <Input
        labelPlacement="inside"
        label="windowInMin"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        errorMessage="Value must be less horizontal filter and non-zero"
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
    </div>
  );
};

export default CrossCorrelationParameterField;
