import ScrollingSpectrogram from './ScrollingSpectrogram';
import recordingConfig from '../../../../configs/recording_parameters.json';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import SpectrogramParameterField from './SpectrogramParameterField';
import { useSpectrogramStream } from '../Hooks/useSpectrogramStream';
import { ConfigurationContext } from '../Contexts/ConfigurataionContext';
import { useContext, useEffect, useState } from 'react';
import {
  DemonSpectrogramPayload,
  SpectrogramPayload,
} from '../Interfaces/SpectrogramPayload';
import DemonSpectrogramParameterField from './DemonSpectrogramParameterField';
import ScrollingDemonSpectrogram from './ScrollingDemonSpectrogram';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';
const sampleRate = recordingConfig['sampleRate'];

const SpectrogramSelection = () => {
  const context = useContext(ConfigurationContext);
  const [spectrogramPayload, setSpectrogramPayload] =
    useState<SpectrogramPayload | null>(null);
  const [demonSpectrogramPayload, setDemonSpectrogramPayload] =
    useState<DemonSpectrogramPayload | null>(null);
  const [chartContainerKey, setChartContainerKey] = useState(0);

  const useConfiguration = () => {
    if (!context) {
      throw new Error(
        'useConfiguration must be used within a ConfigurationProvider'
      );
    }
    return context;
  };

  const { config, isConfigValid } = useConfiguration();
  const {
    spectrogramData,
    demonSpectrogramData,
    isConnected,
    connect,
    disconnect,
  } = useSpectrogramStream(websocketUrl, false);

  useEffect(() => {
    if (!spectrogramData || !isConnected) return;
    setSpectrogramPayload(spectrogramData);
  }, [isConnected, spectrogramData]);

  useEffect(() => {
    if (!demonSpectrogramData || !isConnected) return;
    setDemonSpectrogramPayload(demonSpectrogramData);
  }, [demonSpectrogramData, isConnected]);

  useEffect(() => {
    if (spectrogramPayload && isConnected) {
      setChartContainerKey((prev) => prev + 1);
    }
  }, [spectrogramPayload, isConnected]);

  useEffect(() => {
    if (!config) return;
    console.log('Config: ', config);
  });

  return (
    <div className="flex flex-col h-full w-full">
      {/* Control buttons with improved styling */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          onPress={() => connect(config)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
          disabled={!isConfigValid(config)}
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
        </div>
      </div>

      {/* Tabs container - taking full remaining height */}
      <div className="flex-1 min-h-0 w-full">
        <Tabs key="bordered" aria-label="Graph choice" size="sm" radius="sm">
          <Tab key="spectrogram" title="Spectrogram">
            <div className="h-full flex flex-col bg-slate-800 rounded-lg p-4 shadow-lg">
              {/* Spectrogram container - using flex-1 to take available space */}
              <div
                key={chartContainerKey}
                className="flex-1 w-full relative"
                style={{ minHeight: '400px' }}
              >
                {spectrogramPayload ? (
                  <ScrollingSpectrogram
                    spectrogramData={spectrogramPayload as SpectrogramPayload}
                    windowInMin={
                      config.config.spectrogramConfiguration.windowInMin
                    }
                    resolution={
                      1 +
                      (sampleRate *
                        config.config.spectrogramConfiguration.tperseg) /
                        2
                    }
                    heatmapMinTimeStepMs={500}
                    maxFrequency={
                      config.config.spectrogramConfiguration.maxFrequency
                    }
                    minFrequency={
                      config.config.spectrogramConfiguration.minFrequency
                    }
                    maxDb={config.config.spectrogramConfiguration.maxDb}
                    minDb={config.config.spectrogramConfiguration.minDb}
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
                      <p className="text-lg font-medium">No Spectrogram Data</p>
                      <p className="text-sm mt-1">
                        Click Connect to start streaming
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Parameter field with improved spacing */}
              <div className="mt-4 bg-slate-700 p-3 rounded-md">
                <SpectrogramParameterField />
              </div>
            </div>
          </Tab>
          <Tab key="DEMON" title="DEMON">
            <div className="h-full flex flex-col bg-slate-800 rounded-lg p-4 shadow-lg">
              {/* DEMON container - using flex-1 to take available space */}
              <div
                key={chartContainerKey}
                className="flex-1 w-full relative"
                style={{ minHeight: '400px' }}
              >
                {demonSpectrogramPayload ? (
                  <ScrollingDemonSpectrogram
                    demonSpectrogramData={
                      demonSpectrogramPayload as DemonSpectrogramPayload
                    }
                    windowInMin={
                      config.config.demonSpectrogramConfiguration.windowInMin
                    }
                    resolution={
                      1 +
                      (sampleRate *
                        config.config.demonSpectrogramConfiguration.tperseg) /
                        2
                    }
                    heatmapMinTimeStepMs={500}
                    maxFrequency={
                      config.config.demonSpectrogramConfiguration.maxFrequency
                    }
                    minFrequency={
                      config.config.demonSpectrogramConfiguration.minFrequency
                    }
                    maxDb={config.config.demonSpectrogramConfiguration.maxDb}
                    minDb={config.config.demonSpectrogramConfiguration.minDb}
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
                      <p className="text-lg font-medium">No DEMON Data</p>
                      <p className="text-sm mt-1">
                        Click Connect to start streaming
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Parameter field with improved spacing */}
              <div className="mt-4 bg-slate-700 p-3 rounded-md">
                <DemonSpectrogramParameterField />
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default SpectrogramSelection;
