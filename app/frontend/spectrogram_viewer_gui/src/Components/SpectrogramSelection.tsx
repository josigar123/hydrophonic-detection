import ScrollingSpectrogram from './ScrollingSpectrogram';
import recordingConfig from '../../../../configs/recording_parameters.json';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import SpectrogramParameterField from './SpectrogramParameterField';
import { useSpectrogramStream } from '../Hooks/useSpectrogramStream';
import { useContext, useEffect, useMemo, useState } from 'react';
import DemonSpectrogramParameterField from './DemonSpectrogramParameterField';
import ScrollingDemonSpectrogram from './ScrollingDemonSpectrogram';
import {
  parameterPreset1,
  SpectrogramConfigurationContext,
} from '../Contexts/SpectrogramConfigurationContext';
import { SpectrogramNarrowbandAndDemonConfiguration } from '../Interfaces/Configuration';
import { Tooltip } from '@heroui/tooltip';
import SpectrogramParameterInfoCard from './SpectrogramParameterInfoCard';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';
const sampleRate = recordingConfig['sampleRate'];

const SpectrogramSelection = () => {
  const context = useContext(SpectrogramConfigurationContext);

  if (!context) {
    throw new Error(
      'useConfiguration must be used within a SpectrogramConfigurationProvider'
    );
  }

  const { spectrogramConfig, setSpectrogramConfig } = context;
  const {
    spectrogramData,
    demonSpectrogramData,
    isNarrowbandDetection,
    isConnected,
    connect,
    disconnect,
  } = useSpectrogramStream(websocketUrl, false);

  const [isInvalidConfig, setIsInvalidConfig] = useState(true);

  const [selected, setSelected] = useState('spectrogram');

  // Big chunky, clunky function for validating the input, might want to refactor this
  const validateEntireConfiguration = (
    spectrogramConfig: SpectrogramNarrowbandAndDemonConfiguration
  ): boolean => {
    if (!spectrogramConfig) return false;

    const { spectrogramConfiguration, demonSpectrogramConfiguration } =
      spectrogramConfig;

    if (!spectrogramConfiguration || !demonSpectrogramConfiguration)
      return false;

    return (
      validateWindow(spectrogramConfiguration.window ?? '') &&
      validateTperseg(
        spectrogramConfiguration.tperseg ?? 0,
        spectrogramConfiguration.horizontalFilterLength ?? 0
      ) &&
      validateFrequencyFilter(spectrogramConfiguration.frequencyFilter ?? 0) &&
      validateHorizontalFilterLength(
        spectrogramConfiguration.tperseg ?? 0,
        spectrogramConfiguration.horizontalFilterLength ?? 0
      ) &&
      validateWindowInMin(spectrogramConfiguration.windowInMin ?? 0) &&
      validateMaxFrequency(spectrogramConfiguration.maxFrequency ?? 0) &&
      validateMinFrequency(spectrogramConfiguration.minFrequency ?? 0) &&
      validateMaxDb(spectrogramConfiguration.maxDb ?? 0) &&
      validateMinDb(spectrogramConfiguration.minDb ?? 0) &&
      validateNarrowbandThreshold(
        spectrogramConfiguration.narrowbandThreshold ?? 0
      ) &&
      validateDemonSampleFrequency(
        demonSpectrogramConfiguration.demonSampleFrequency ?? 0
      ) &&
      validateTperseg(
        demonSpectrogramConfiguration.tperseg ?? 0,
        demonSpectrogramConfiguration.horizontalFilterLength ?? 0
      ) &&
      validateFrequencyFilter(
        demonSpectrogramConfiguration.frequencyFilter ?? 0
      ) &&
      validateHorizontalFilterLength(
        demonSpectrogramConfiguration.tperseg ?? 0,
        demonSpectrogramConfiguration.horizontalFilterLength ?? 0
      ) &&
      validateWindowInMin(demonSpectrogramConfiguration.windowInMin ?? 0) &&
      validateMaxFrequency(demonSpectrogramConfiguration.maxFrequency ?? 0) &&
      validateMinFrequency(demonSpectrogramConfiguration.minFrequency ?? 0) &&
      validateMaxDb(demonSpectrogramConfiguration.maxDb ?? 0) &&
      validateMinDb(demonSpectrogramConfiguration.minDb ?? 0) &&
      validateWindow(demonSpectrogramConfiguration.window ?? '')
    );
  };

  const validateWindow = (window: string) => {
    if (window === undefined || window === '') return false;

    return true;
  };

  const validateTperseg = (tperseg: number, horizontalFilterLength: number) => {
    if (
      tperseg === undefined ||
      tperseg === 0 ||
      tperseg >= horizontalFilterLength
    )
      return false;

    return true;
  };

  const validateFrequencyFilter = (frequencyFilter: number) => {
    if (
      frequencyFilter === undefined ||
      frequencyFilter % 2 === 0 ||
      frequencyFilter === 0
    )
      return false;

    return true;
  };

  const validateHorizontalFilterLength = (
    tperseg: number,
    horizontalFilterLength: number
  ) => {
    if (
      horizontalFilterLength === undefined ||
      horizontalFilterLength === 0 ||
      horizontalFilterLength <= tperseg
    )
      return false;

    return true;
  };

  const validateWindowInMin = (windowInMin: number) => {
    if (
      windowInMin === undefined ||
      windowInMin === 0 ||
      !Number.isInteger(windowInMin)
    )
      return false;

    return true;
  };

  const validateMaxFrequency = (maxFrequency: number) => {
    if (maxFrequency === undefined) return false;

    return true;
  };

  const validateMinFrequency = (minFrequency: number) => {
    if (minFrequency === undefined) return false;

    return true;
  };
  const validateMaxDb = (maxDb: number) => {
    if (maxDb === undefined) return false;

    return true;
  };
  const validateMinDb = (minDb: number) => {
    if (minDb === undefined) return false;

    return true;
  };

  const validateNarrowbandThreshold = (narrowbandThreshold: number) => {
    if (narrowbandThreshold === undefined) return false;

    return true;
  };

  const validateDemonSampleFrequency = (demonSampleFrequency: number) => {
    if (demonSampleFrequency === undefined || demonSampleFrequency === 0)
      return false;

    return true;
  };

  // Memoize configuration to prevent unnecessary re-renders
  const spectrogramProps = useMemo(
    () => ({
      windowInMin:
        spectrogramConfig.spectrogramConfiguration?.windowInMin ?? 10,
      // Resolution default to Nyquist frequency
      resolution:
        1 +
        (sampleRate *
          (spectrogramConfig.spectrogramConfiguration?.tperseg ?? 1)) /
          2,
      heatmapMinTimeStepMs:
        (spectrogramConfig.spectrogramConfiguration?.horizontalFilterLength ??
          10) * 1000,
      maxFrequency:
        spectrogramConfig.spectrogramConfiguration?.maxFrequency ?? 1000,
      minFrequency:
        spectrogramConfig.spectrogramConfiguration?.minFrequency ?? 0,
      maxDb: spectrogramConfig.spectrogramConfiguration?.maxDb ?? 100,
      minDb: spectrogramConfig.spectrogramConfiguration?.minDb ?? -100,
    }),
    [spectrogramConfig]
  );

  const demonSpectrogramProps = useMemo(
    () => ({
      windowInMin:
        spectrogramConfig.demonSpectrogramConfiguration?.windowInMin ?? 10,
      // Resolution default to Nyquist frequency
      resolution:
        1 +
        (sampleRate *
          (spectrogramConfig.demonSpectrogramConfiguration?.tperseg ?? 1)) /
          2,
      heatmapMinTimeStepMs:
        (spectrogramConfig.demonSpectrogramConfiguration
          ?.horizontalFilterLength ?? 10) * 1000,
      maxFrequency:
        spectrogramConfig.demonSpectrogramConfiguration?.maxFrequency ?? 1000,
      minFrequency:
        spectrogramConfig.demonSpectrogramConfiguration?.minFrequency ?? 0,
      maxDb: spectrogramConfig.demonSpectrogramConfiguration?.maxDb ?? 100,
      minDb: spectrogramConfig.demonSpectrogramConfiguration?.minDb ?? -100,
    }),
    [spectrogramConfig]
  );

  useEffect(() => {
    console.log(selected);
  }, [selected]);

  const handlePreset1 = () => {
    setSpectrogramConfig(parameterPreset1);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Control buttons with improved styling */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          onPress={() => {
            if (validateEntireConfiguration(spectrogramConfig)) {
              setIsInvalidConfig(false);
              connect(spectrogramConfig);
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
          {isNarrowbandDetection ? (
            <div>
              <span className="inline-flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                Detection in narrowband
              </span>
            </div>
          ) : (
            <div>
              <span className="inline-flex items-center text-gray-500">
                <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                No detection in narrowband
              </span>
            </div>
          )}
          {isInvalidConfig && (
            <div className="text-red-300">
              <p className="font-medium">Ensure all fields have valid values</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs container - taking full remaining height */}
      <div className="relative flex-1 min-h-0 w-full">
        <Tooltip
          content="Apply a preset for the spectrogram and DEMON spectrogram"
          size="md"
          closeDelay={10}
        >
          <Button onPress={handlePreset1} className="absolute right-48 ">
            Preset
          </Button>
        </Tooltip>
        <Tooltip
          placement="bottom-end"
          size="lg"
          closeDelay={10}
          content={<SpectrogramParameterInfoCard />}
        >
          <Button className="absolute right-2">Parameter information</Button>
        </Tooltip>
        <Tabs
          key="bordered"
          aria-label="Graph choice"
          size="md"
          radius="sm"
          selectedKey={selected}
          onSelectionChange={(key) => setSelected(String(key))}
        >
          <Tab key="spectrogram" title="Spectrogram"></Tab>
          <Tab key="demon" title="DEMON"></Tab>
        </Tabs>
        <div className={`${selected === 'spectrogram' ? 'block' : 'hidden'}`}>
          <div className="h-full flex flex-col bg-slate-800 rounded-lg p-4 shadow-lg">
            {/* Spectrogram container - using flex-1 to take available space */}

            <div
              className="flex-1 w-full relative"
              style={{ minHeight: '400px' }}
            >
              {spectrogramData ? (
                <ScrollingSpectrogram
                  spectrogramData={spectrogramData}
                  windowInMin={spectrogramProps.windowInMin}
                  resolution={spectrogramProps.resolution}
                  heatmapMinTimeStepMs={spectrogramProps.heatmapMinTimeStepMs}
                  maxFrequency={spectrogramProps.maxFrequency}
                  minFrequency={spectrogramProps.minFrequency}
                  maxDb={spectrogramProps.maxDb}
                  minDb={spectrogramProps.minDb}
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
              <SpectrogramParameterField isConnected={isConnected} />
            </div>
          </div>
        </div>
        <div className={`${selected === 'demon' ? 'block' : 'hidden'}`}>
          <div className="h-full flex flex-col bg-slate-800 rounded-lg p-4 shadow-lg">
            {/* DEMON container - using flex-1 to take available space */}
            <div
              className="flex-1 w-full relative"
              style={{ minHeight: '400px' }}
            >
              {demonSpectrogramData ? (
                <ScrollingDemonSpectrogram
                  demonSpectrogramData={demonSpectrogramData}
                  windowInMin={demonSpectrogramProps.windowInMin}
                  resolution={demonSpectrogramProps.resolution}
                  heatmapMinTimeStepMs={
                    demonSpectrogramProps.heatmapMinTimeStepMs
                  }
                  maxFrequency={demonSpectrogramProps.maxFrequency}
                  minFrequency={demonSpectrogramProps.minFrequency}
                  maxDb={demonSpectrogramProps.maxDb}
                  minDb={demonSpectrogramProps.minDb}
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
              {/* Parameter field with improved spacing */}
              <div className="mt-4 bg-slate-700 p-3 rounded-md">
                <DemonSpectrogramParameterField isConnected={isConnected} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpectrogramSelection;
