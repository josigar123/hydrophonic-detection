import { Input } from '@heroui/input';
import { useContext, useEffect, useState } from 'react';
import { BroadbandConfiguration } from '../Interfaces/Configuration';
import { BroadbandConfigurationContext } from '../Contexts/BroadbandConfigurationContext';

const BroadbandParameterField = () => {
  const context = useContext(BroadbandConfigurationContext);

  const useConfiguration = () => {
    if (!context) {
      throw new Error(
        'useConfiguration must be used within a BroadbandConfigurationProvider'
      );
    }
    return context;
  };

  const { broadbandConfiguration, setBroadbandConfig } = useConfiguration();

  const [localParams, setLocalParams] = useState<BroadbandConfiguration>({
    broadbandThreshold: 0,
    windowSize: 0,
    hilbertWindow: 0,
    bufferLength: 0,
  });

  useEffect(() => {
    if (broadbandConfiguration) {
      setLocalParams((prev) => ({
        ...prev,
        ...broadbandConfiguration,
      }));
    }
  }, [broadbandConfiguration]);

  const handleInputChange = (
    field: keyof BroadbandConfiguration,
    value: string
  ) => {
    const parsedValued = isNaN(Number(value)) ? value : Number(value);

    setLocalParams((prevParams) => ({
      ...prevParams,
      [field]: parsedValued,
    }));

    setBroadbandConfig((prevConfig) => ({
      ...prevConfig,
      [field]: parsedValued,
    }));
  };

  return (
    <div className="flex w-full gap-x-4 items-center">
      <Input
        labelPlacement="inside"
        label="broadbandThreshold"
        className="flex-1 min-w-0 h-12"
        value={localParams?.broadbandThreshold.toString() || ''}
        onChange={(e) =>
          handleInputChange('broadbandThreshold', e.target.value)
        }
      />
      <Input
        labelPlacement="inside"
        label="windowSize"
        className="flex-1 min-w-0 h-12"
        value={localParams?.windowSize.toString() || ''}
        onChange={(e) => handleInputChange('windowSize', e.target.value)}
      />
      <Input
        labelPlacement="inside"
        label="hilbertWindow"
        className="flex-1 min-w-0 h-12"
        value={localParams?.hilbertWindow.toString() || ''}
        onChange={(e) => handleInputChange('hilbertWindow', e.target.value)}
      />
      <Input
        labelPlacement="inside"
        label="bufferLength"
        className="flex-1 min-w-0 h-12"
        value={localParams?.bufferLength.toString() || ''}
        onChange={(e) => handleInputChange('bufferLength', e.target.value)}
      />
    </div>
  );
};

export default BroadbandParameterField;
