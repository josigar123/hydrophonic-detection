import ScrollingSpectrogram from './ScrollingSpectrogram';
import recordingConfig from '../../../../configs/recording_parameters.json';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import SpectrogramParameterField from './SpectrogramParameterField';
import { useSpectrogramStream } from '../Hooks/useSpectrogramStream';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import DemonSpectrogramParameterField from './DemonSpectrogramParameterField';
import ScrollingDemonSpectrogram from './ScrollingDemonSpectrogram';
import {
  parameterPreset1,
  SpectrogramConfigurationContext,
} from '../Contexts/SpectrogramConfigurationContext';
import { SpectrogramNarrowbandAndDemonConfiguration } from '../Interfaces/Configuration';
import { Tooltip } from '@heroui/tooltip';
import SpectrogramParameterInfoCard from './SpectrogramParameterInfoCard';

import {
  denormalizedInfernoData,
  denormalizedViridisData,
} from '../ColorMaps/colorMaps';
import { Color } from '@lightningchart/lcjs';
import { DetectionContext } from '../Contexts/DetectionContext';
import { ValidityContext } from '../Contexts/InputValidationContext';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';
const sampleRate = recordingConfig['sampleRate'];

interface SpectrogramSelectionProps {
  isMonitoring: boolean;
}

const SpectrogramSelection = ({ isMonitoring }: SpectrogramSelectionProps) => {
  const context = useContext(SpectrogramConfigurationContext);

  const detectionContext = useContext(DetectionContext);

  const validityContext = useContext(ValidityContext);

  if (!context) {
    throw new Error(
      'In SpectrogramSelection.tsx: SpectrogramConfigurationContext must be used within a SpectrogramConfigurationProvider'
    );
  }

  if (!detectionContext) {
    throw new Error(
      'In SpectrogramSelection.tsx: DetectionContext must be used within a DetectionContextProvider'
    );
  }

  if (!validityContext) {
    throw new Error(
      'In SpectrogramSelection.tsx: ValidityContext must be used within a ValidityContextProvider'
    );
  }

  const { spectrogramConfig, setSpectrogramConfig } = context;
  const { setDetection } = detectionContext;
  const { setValidity } = validityContext;

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

  const [selectedColormap, setSelectedColormap] = useState('inferno');

  const [colorMapValues, setColorMapValues] = useState<Color[]>(
    denormalizedInfernoData
  );

  // Big chunky, clunky function for validating the input, might want to refactor this
  const validateEntireConfiguration = useCallback(
    (
      spectrogramConfig: SpectrogramNarrowbandAndDemonConfiguration
    ): boolean => {
      if (!spectrogramConfig) return false;

      const { spectrogramConfiguration, demonSpectrogramConfiguration } =
        spectrogramConfig;

      if (!spectrogramConfiguration || !demonSpectrogramConfiguration)
        return false;

      return (
        validateColorMap(selectedColormap ?? '') &&
        validateWindow(spectrogramConfiguration.window ?? '') &&
        validateTperseg(
          spectrogramConfiguration.tperseg ?? 0,
          spectrogramConfiguration.horizontalFilterLength ?? 0
        ) &&
        validateFrequencyFilter(
          spectrogramConfiguration.frequencyFilter ?? 0
        ) &&
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
    },
    [selectedColormap]
  );

  const validateColorMap = (map: string) => {
    if (map === undefined || map === '') {
      return false;
    }

    return true;
  };

  const validateWindow = (window: string) => {
    if (window === undefined || window === '') {
      return false;
    }

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

  const handlePreset1 = () => {
    setSpectrogramConfig(parameterPreset1);
  };

  // Side effect for connecting to the stream
  useEffect(() => {
    const isValid = validateEntireConfiguration(spectrogramConfig);

    setIsInvalidConfig(!isValid);
    setValidity((prev) => ({
      ...prev,
      isSpectrogramConfigValid: isValid,
    }));

    if (isMonitoring && isValid) {
      connect(spectrogramConfig);
    } else {
      disconnect();
    }
  }, [
    connect,
    disconnect,
    isInvalidConfig,
    isMonitoring,
    setValidity,
    spectrogramConfig,
    validateEntireConfiguration,
  ]);

  // Effect for updating global context
  useEffect(() => {
    setDetection((prev) => ({
      ...prev,
      narrowbandDetection: isNarrowbandDetection,
    }));
  }, [isNarrowbandDetection, setDetection]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top bar with status, tabs and buttons */}
      <div className="flex items-center justify-between mb-4">
        {/* Left side: Status and message with separator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {isConnected ? (
              <span className="inline-flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse text-green-500"></span>
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center text-gray-500">
                <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                Disconnected
              </span>
            )}
          </div>

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

        {/* Middle: Tabs */}
        <div className="flex-1 flex justify-center">
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
        </div>

        {/* Right side: Buttons */}
        <div className="flex items-center gap-2">
          <Tabs
            isDisabled={isConnected}
            radius="sm"
            selectedKey={selectedColormap}
            onSelectionChange={(key) => {
              switch (String(key)) {
                case 'inferno':
                  setColorMapValues(denormalizedInfernoData);
                  break;
                case 'viridis':
                  setColorMapValues(denormalizedViridisData);
                  break;
              }
              setSelectedColormap(String(key));
            }}
          >
            <Tab key="inferno" title="Inferno"></Tab>
            <Tab key="viridis" title="Viridis"></Tab>
          </Tabs>

          <Tooltip
            content="Apply a preset for the spectrogram and DEMON spectrogram"
            size="md"
            closeDelay={10}
          >
            <Button onPress={handlePreset1}>Preset</Button>
          </Tooltip>

          <Tooltip
            placement="bottom-end"
            size="lg"
            closeDelay={10}
            content={<SpectrogramParameterInfoCard />}
          >
            <Button>Parameter information</Button>
          </Tooltip>
        </div>
      </div>

      {/* Spectrogram area */}
      <div className="relative flex-1 min-h-0 w-full">
        <div className={`${selected === 'spectrogram' ? 'block' : 'hidden'}`}>
          <div className="h-full flex flex-col bg-slate-800 rounded-lg p-4 shadow-lg">
            {/* Spectrogram content*/}
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
                  colorMap={colorMapValues}
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
            <div className="mt-4 bg-slate-700 p-3 rounded-md">
              <SpectrogramParameterField isConnected={isConnected} />
            </div>
          </div>
        </div>

        {/* DEMON*/}
        <div className={`${selected === 'demon' ? 'block' : 'hidden'}`}>
          <div className="h-full flex flex-col bg-slate-800 rounded-lg p-4 shadow-lg">
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
                  colorMap={colorMapValues}
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
