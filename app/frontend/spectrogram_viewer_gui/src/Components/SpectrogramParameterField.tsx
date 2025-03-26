import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import {
  useContext,
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';
import { validWindowTypes } from '../Interfaces/WindowTypes';
import { SpectrogramConfigurationContext } from '../Contexts/SpectrogramConfigurationContext';

interface SpectrogramParameterFieldProps {
  isConnected: boolean;
}

const SpectrogramParameterField = ({
  isConnected,
}: SpectrogramParameterFieldProps) => {
  const context = useContext(SpectrogramConfigurationContext);

  if (!context) {
    throw new Error(
      'SpectrogramParameterField must be used within a SpectrogramConfigurationProvider'
    );
  }

  const { spectrogramConfig, setSpectrogramConfig } = context;
  const config = spectrogramConfig.spectrogramConfiguration || {};

  // Use local state only for input values
  const [inputValues, setInputValues] = useState({
    window: config.window || '',
    tperseg: config.tperseg?.toString() || '',
    frequencyFilter: config.frequencyFilter?.toString() || '',
    horizontalFilterLength: config.horizontalFilterLength?.toString() || '',
    windowInMin: config.windowInMin?.toString() || '',
    maxFrequency: config.maxFrequency?.toString() || '',
    minFrequency: config.minFrequency?.toString() || '',
    maxDb: config.maxDb?.toString() || '',
    minDb: config.minDb?.toString() || '',
    narrowbandThreshold: config.narrowbandThreshold?.toString() || '',
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
            spectrogramConfiguration: {
              ...prevConfig.spectrogramConfiguration,
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
        spectrogramConfiguration: {
          ...prevConfig.spectrogramConfiguration,
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
        spectrogramConfiguration: {
          ...prevConfig.spectrogramConfiguration,
          window,
        },
      }));
    },
    [setSpectrogramConfig]
  );

  // Validation functions
  const isTpersegInvalid = useMemo(() => {
    const tperseg = Number(inputValues.tperseg);
    const horizontalFilterLength = Number(inputValues.horizontalFilterLength);

    if (!inputValues.tperseg || tperseg === 0) return true;
    if (tperseg >= horizontalFilterLength) return true;

    return false;
  }, [inputValues.tperseg, inputValues.horizontalFilterLength]);

  const validateFilterLength = (value: number) =>
    value % 2 === 0 ? false : true;

  const isFreqFiltInvalid = useMemo(() => {
    const frequencyFilter = Number(inputValues.frequencyFilter);

    if (!inputValues.frequencyFilter || frequencyFilter === 0) return true;
    return !validateFilterLength(frequencyFilter);
  }, [inputValues.frequencyFilter]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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
        label="tperseg"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        errorMessage="Value must be less horizontal filter and non-zero"
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[s]</span>
          </div>
        }
        isInvalid={isTpersegInvalid}
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
        errorMessage="Value must be odd and non-zero"
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[fBins]</span>
          </div>
        }
        isInvalid={isFreqFiltInvalid}
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
        value={inputValues.horizontalFilterLength}
        isDisabled={isConnected}
        onChange={(e) =>
          handleInputChange('horizontalFilterLength', e.target.value)
        }
        onBlur={() => handleBlur('horizontalFilterLength')}
      />
      <Input
        labelPlacement="inside"
        label="winLen"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[min]</span>
          </div>
        }
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
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[dB]</span>
          </div>
        }
        value={inputValues.maxDb}
        onChange={(e) => handleInputChange('maxDb', e.target.value)}
        onBlur={() => handleBlur('maxDb')}
      />
      <Input
        labelPlacement="inside"
        label="minDb"
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
      <Input
        labelPlacement="inside"
        label="NBThresh"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[dB]</span>
          </div>
        }
        value={inputValues.narrowbandThreshold}
        onChange={(e) =>
          handleInputChange('narrowbandThreshold', e.target.value)
        }
        onBlur={() => handleBlur('narrowbandThreshold')}
      />
    </div>
  );
};

export default SpectrogramParameterField;
