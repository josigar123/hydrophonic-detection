import BroadbandParameterField from './BroadbandParameterField';
import ScrollingBroadBand from './ScrollingBroadBand';
import { useContext, useState } from 'react';
import { Button } from '@heroui/button';
import { useBroadbandStream } from '../Hooks/useBroadbandStream';
import { BroadbandConfigurationContext } from '../Contexts/BroadbandConfigurationContext';
import { BroadbandConfiguration } from '../Interfaces/Configuration';

const websocketUrl = 'ws://localhost:8766?client_name=broadband_client';

const BroadbandComponent = () => {
  const context = useContext(BroadbandConfigurationContext);

  if (!context) {
    throw new Error(
      'useConfiguration must be used within a SpectrogramConfigurationProvider'
    );
  }

  const { broadbandConfiguration } = context;

  const {
    broadbandData,
    isBroadbandDetection,
    isConnected,
    error,
    connect,
    disconnect,
  } = useBroadbandStream(websocketUrl, false);

  const [isInvalidConfig, setIsInvalidConfig] = useState(true);

  // Input validator function for broadband config
  const validateBroadbandConfiguration = (
    broadbandConfiguration: BroadbandConfiguration
  ) => {
    if (!broadbandConfiguration) return false;

    const { broadbandThreshold, windowSize, hilbertWindow, bufferLength } =
      broadbandConfiguration;

    if (!broadbandThreshold || !windowSize || !hilbertWindow || !bufferLength)
      return false;

    return (
      validateBroadbandThreshold(broadbandThreshold) &&
      validateWindowSize(windowSize) &&
      validateHilbertWindow(hilbertWindow) &&
      validateBufferLength(bufferLength)
    );
  };

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

  return (
    <div className="flex flex-col h-full w-full">
      {/* Control buttons with improved styling */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          onPress={() => {
            if (validateBroadbandConfiguration(broadbandConfiguration)) {
              setIsInvalidConfig(false);
              connect(broadbandConfiguration);
            } else {
              setIsInvalidConfig(true);
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          Connect
        </Button>
        <Button
          onPress={disconnect}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
          disabled={!isConnected}
        >
          Disconnect
        </Button>
        <div className="ml-2">
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
          {isBroadbandDetection ? (
            <div>
              <span className="inline-flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                Detection in broadband
              </span>
            </div>
          ) : (
            <div>
              <span className="inline-flex items-center text-gray-500">
                <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                No detection in broadband
              </span>
            </div>
          )}
          {isInvalidConfig && (
            <div className="text-red-300">
              <p className="font-medium">
                Error: Ensure all fields have valid values
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="h-full flex flex-col bg-slate-800 rounded-lg p-4 shadow-lg">
        <div className="flex-1 w-full relative" style={{ minHeight: '400px' }}>
          {broadbandData ? (
            <ScrollingBroadBand />
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
