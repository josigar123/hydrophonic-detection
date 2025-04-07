import { Input } from '@heroui/input';
import {
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { BroadbandConfigurationContext } from '../Contexts/BroadbandConfigurationContext';

interface BroadbandParameterFieldProps {
  isConnected: boolean;
}

const BroadbandParameterField = ({
  isConnected,
}: BroadbandParameterFieldProps) => {
  const context = useContext(BroadbandConfigurationContext);

  if (!context) {
    throw new Error(
      'BroadbandParameterField must be used within a BroadbandConfigurationProvider'
    );
  }

  const { broadbandConfiguration, setBroadbandConfig } = context;

  // Use local state only for input values
  const [inputValues, setInputValues] = useState({
    broadbandThreshold:
      broadbandConfiguration?.broadbandThreshold?.toString() || '',
    windowSize: broadbandConfiguration?.windowSize?.toString() || '',
    hilbertWindow: broadbandConfiguration?.hilbertWindow?.toString() || '',
    bufferLength: broadbandConfiguration?.bufferLength?.toString() || '',
    windowLength: broadbandConfiguration?.windowLength?.toString() || '',
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
        setBroadbandConfig((prevConfig) => {
          const parsedValue = isNaN(Number(value)) ? value : Number(value);
          return {
            ...prevConfig,
            [field]: parsedValue,
          };
        });
      }, 300); // 300ms debounce
    },
    [setBroadbandConfig]
  );

  // Handle blur to ensure value is committed when field loses focus
  const handleBlur = useCallback(
    (field: keyof typeof inputValues) => {
      const value = inputValues[field];
      const parsedValue = isNaN(Number(value)) ? value : Number(value);

      setBroadbandConfig((prevConfig) => ({
        ...prevConfig,
        [field]: parsedValue,
      }));

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    },
    [inputValues, setBroadbandConfig]
  );

  // Effect for updating fields, when context changes e.g when a preset is selected
  useEffect(() => {
    setInputValues({
      broadbandThreshold:
        broadbandConfiguration.broadbandThreshold?.toString() || '',
      windowSize: broadbandConfiguration.windowSize?.toString() || '',
      hilbertWindow: broadbandConfiguration.hilbertWindow?.toString() || '',
      bufferLength: broadbandConfiguration.bufferLength?.toString() || '',
      windowLength: broadbandConfiguration.windowLength?.toString() || '',
    });
  }, [broadbandConfiguration]);

  const isbroadbandThresholdInvalid = useMemo(() => {
    const broadbandThreshold = Number(inputValues.broadbandThreshold);

    if (!inputValues.broadbandThreshold || broadbandThreshold === 0)
      return true;

    return false;
  }, [inputValues.broadbandThreshold]);

  const isWindowSizeInvalid = useMemo(() => {
    const windowSize = Number(inputValues.windowSize);

    if (!inputValues.windowSize || windowSize === 0) return true;

    return false;
  }, [inputValues.windowSize]);

  const isHilbertWindowInvalid = useMemo(() => {
    const hilbertWindow = Number(inputValues.hilbertWindow);

    if (
      !inputValues.hilbertWindow ||
      hilbertWindow === 0 ||
      hilbertWindow % 1 !== 0
    )
      return true;

    return false;
  }, [inputValues.hilbertWindow]);

  const isWindowLengthInvalid = useMemo(() => {
    const windowLength = Number(inputValues.windowLength);

    if (
      !inputValues.windowLength ||
      windowLength === 0 ||
      !Number.isInteger(windowLength)
    ) {
      return true;
    }

    return false;
  }, [inputValues.windowLength]);

  const isBufferLengthInvalid = useMemo(() => {
    const bufferLength = Number(inputValues.bufferLength);

    if (!inputValues.bufferLength || bufferLength === 0) return true;

    return false;
  }, [inputValues.bufferLength]);

  return (
    <div className="flex w-full gap-x-4 items-center">
      <Input
        labelPlacement="inside"
        label="hilbertWin"
        isInvalid={isHilbertWindowInvalid}
        errorMessage="hilbertWin must be non-zero and a whole number"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[S]</span>
          </div>
        }
        isDisabled={isConnected}
        value={inputValues.hilbertWindow}
        onChange={(e) => handleInputChange('hilbertWindow', e.target.value)}
        onBlur={() => handleBlur('hilbertWindow')}
      />
      <Input
        labelPlacement="inside"
        label="winSize"
        isInvalid={isWindowSizeInvalid}
        errorMessage="winSize must be non-zero"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[s]</span>
          </div>
        }
        value={inputValues.windowSize}
        isDisabled={isConnected}
        onChange={(e) => handleInputChange('windowSize', e.target.value)}
        onBlur={() => handleBlur('windowSize')}
      />
      <Input
        labelPlacement="inside"
        label="winLen"
        isInvalid={isWindowLengthInvalid}
        errorMessage="winLen must be a non-zero integer"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[min]</span>
          </div>
        }
      />
      <Input
        labelPlacement="inside"
        label="bufferLen"
        isInvalid={isBufferLengthInvalid}
        errorMessage={<div>bufferLen must be non-zero</div>}
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[s]</span>
          </div>
        }
        isDisabled={isConnected}
        value={inputValues.bufferLength}
        onChange={(e) => handleInputChange('bufferLength', e.target.value)}
        onBlur={() => handleBlur('bufferLength')}
      />
      <Input
        labelPlacement="inside"
        label="BBThresh"
        isInvalid={isbroadbandThresholdInvalid}
        errorMessage="BBThresh must be non-zero"
        className={`flex-1 min-w-0 h-12 ${
          isConnected ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        endContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">[dB]</span>
          </div>
        }
        value={inputValues.broadbandThreshold}
        isDisabled={isConnected}
        onChange={(e) =>
          handleInputChange('broadbandThreshold', e.target.value)
        }
        onBlur={() => handleBlur('broadbandThreshold')}
      />
    </div>
  );
};

export default BroadbandParameterField;
