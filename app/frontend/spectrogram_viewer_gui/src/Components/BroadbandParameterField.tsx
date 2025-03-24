import { Input } from '@heroui/input';
import { useContext, useState, useCallback, useRef } from 'react';
import { BroadbandConfigurationContext } from '../Contexts/BroadbandConfigurationContext';

const BroadbandParameterField = () => {
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

  return (
    <div className="flex w-full gap-x-4 items-center">
      <Input
        labelPlacement="inside"
        label="broadbandThreshold"
        className="flex-1 min-w-0 h-12"
        value={inputValues.broadbandThreshold}
        onChange={(e) =>
          handleInputChange('broadbandThreshold', e.target.value)
        }
        onBlur={() => handleBlur('broadbandThreshold')}
      />
      <Input
        labelPlacement="inside"
        label="windowSize"
        className="flex-1 min-w-0 h-12"
        value={inputValues.windowSize}
        onChange={(e) => handleInputChange('windowSize', e.target.value)}
        onBlur={() => handleBlur('windowSize')}
      />
      <Input
        labelPlacement="inside"
        label="hilbertWindow"
        className="flex-1 min-w-0 h-12"
        value={inputValues.hilbertWindow}
        onChange={(e) => handleInputChange('hilbertWindow', e.target.value)}
        onBlur={() => handleBlur('hilbertWindow')}
      />
      <Input
        labelPlacement="inside"
        label="bufferLength"
        className="flex-1 min-w-0 h-12"
        value={inputValues.bufferLength}
        onChange={(e) => handleInputChange('bufferLength', e.target.value)}
        onBlur={() => handleBlur('bufferLength')}
      />
    </div>
  );
};

export default BroadbandParameterField;
