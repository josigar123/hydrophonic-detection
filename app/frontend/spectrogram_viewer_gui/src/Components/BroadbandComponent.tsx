import BroadbandParameterField from './BroadbandParameterField';
import ScrollingBroadBand from './ScrollingBroadBand';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button } from '@heroui/button';
import { useBroadbandStream } from '../Hooks/useBroadbandStream';
import {
  BroadbandConfigurationContext,
  broadbandPreset1,
} from '../Contexts/BroadbandConfigurationContext';
import { BroadbandConfiguration } from '../Interfaces/Configuration';
import { Tooltip } from '@heroui/tooltip';
import BroadbandParameterInfoCard from './BroadbandParameterInfoCard';
import { DetectionContext } from '../Contexts/DetectionContext';
import { ValidityContext } from '../Contexts/InputValidationContext';

const websocketUrl = 'ws://localhost:8766?client_name=broadband_client';

interface BroadbandComponentProps {
  isMonitoring: boolean;
}

const BroadbandComponent = ({ isMonitoring }: BroadbandComponentProps) => {
  const context = useContext(BroadbandConfigurationContext);

  const detectionContext = useContext(DetectionContext);

  const validityContext = useContext(ValidityContext);

  if (!context) {
    throw new Error(
      'In BroadbandComponent.tsx: BroadbandConfigurationContext must be used within a BroadbandConfigurationProvider'
    );
  }

  if (!detectionContext) {
    throw new Error(
      'In BroadbandComponent.tsx: DetectionContext must be used within a DetectionContextProvider'
    );
  }

  if (!validityContext) {
    throw new Error(
      'In BroadbandComponent.tsx: ValidityContext must be used within a ValidityContextProvider'
    );
  }

  const { broadbandConfiguration, setBroadbandConfig } = context;

  const { setDetection } = detectionContext;

  const { setValidity } = validityContext;

  const {
    broadbandData,
    isBroadbandDetections,
    isConnected,
    connect,
    disconnect,
  } = useBroadbandStream(websocketUrl, false);

  const [isInvalidConfig, setIsInvalidConfig] = useState(true);

  // Input validator function for broadband config
  const validateBroadbandConfiguration = useCallback(
    (broadbandConfiguration: BroadbandConfiguration) => {
      if (!broadbandConfiguration) return false;

      const {
        broadbandThreshold,
        windowSize,
        hilbertWindow,
        bufferLength,
        windowLength,
      } = broadbandConfiguration;

      if (
        !broadbandThreshold ||
        !windowSize ||
        !hilbertWindow ||
        !bufferLength ||
        !windowLength
      )
        return false;

      return (
        validateBroadbandThreshold(broadbandThreshold) &&
        validateWindowSize(windowSize) &&
        validateHilbertWindow(hilbertWindow) &&
        validateBufferLength(bufferLength) &&
        validateWindowLength(windowLength)
      );
    },
    []
  );

  const validateBroadbandThreshold = (broadbandThreshold: number) => {
    if (broadbandThreshold === undefined || broadbandThreshold === 0)
      return false;

    return true;
  };

  const validateWindowSize = (windowSize: number) => {
    if (windowSize === undefined || windowSize === 0) return false;

    return true;
  };

  const validateHilbertWindow = (hilbertWindow: number) => {
    if (hilbertWindow === undefined || hilbertWindow === 0) return false;

    return true;
  };

  const validateBufferLength = (bufferLength: number) => {
    if (
      bufferLength === undefined ||
      bufferLength === 0 ||
      !Number.isInteger(bufferLength)
    )
      return false;

    return true;
  };

  const validateWindowLength = (windowLength: number) => {
    if (
      windowLength === undefined ||
      windowLength === 0 ||
      !Number.isInteger(windowLength)
    ) {
      return false;
    }

    return true;
  };

  const broadbandProps = useMemo(
    () => ({
      windowInMin: broadbandConfiguration.windowLength ?? 10,
    }),
    [broadbandConfiguration]
  );

  const handlePreset1 = () => {
    setBroadbandConfig(broadbandPreset1);
  };

  useEffect(() => {
    if (validateBroadbandConfiguration(broadbandConfiguration)) {
      setIsInvalidConfig(false);

      setValidity((prev) => ({
        ...prev,
        isBroadbandConfigValid: true,
      }));
    } else {
      setIsInvalidConfig(true);
      setValidity((prev) => ({
        ...prev,
        isBroadbandConfigValid: false,
      }));
    }

    if (isMonitoring && !isInvalidConfig) {
      connect(broadbandConfiguration);
    } else {
      disconnect();
    }
  }, [
    validateBroadbandConfiguration,
    broadbandConfiguration,
    isMonitoring,
    isInvalidConfig,
    connect,
    disconnect,
    setValidity,
  ]);

  // Effect for updating context if there has been a detection
  useEffect(() => {
    setDetection((prev) => ({
      ...prev,
      broadbandDetections: isBroadbandDetections,
    }));
  }, [isBroadbandDetections, setDetection]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {isConnected ? (
            <span className="inline-flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
              Disconnected
            </span>
          )}

          {/* Separator */}
          {isInvalidConfig && (
            <>
              <span className="text-gray-400 px-2">|</span>
              <div className="text-red-300">
                <p className="font-medium">
                  Ensure all fields have valid values
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Tooltip
            content="Apply a preset for the broadband analysis"
            size="md"
            closeDelay={10}
          >
            <Button onPress={handlePreset1}>Preset</Button>
          </Tooltip>
          <Tooltip
            placement="bottom-end"
            size="lg"
            closeDelay={10}
            content={<BroadbandParameterInfoCard />}
          >
            <Button>Parameter information</Button>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col flex-1 bg-slate-800 rounded-lg p-4 shadow-lg overflow-hidden">
        <div className="flex-1 w-full relative overflow-hidden">
          {broadbandData ? (
            <ScrollingBroadBand
              broadbandData={broadbandData}
              windowInMin={broadbandProps.windowInMin}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-lg font-medium">No Broadband Data</p>
                <p className="text-sm mt-1">Click Connect to start streaming</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 bg-slate-700 p-3 rounded-md">
          <BroadbandParameterField isConnected={isConnected} />
        </div>
      </div>
    </div>
  );
};

export default BroadbandComponent;
