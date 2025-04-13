import AisDataTable from '../Components/AisDataTable';
import MapComponent from '../Components/MapComponent';
import WaveformSelection from '../Components/WaveformSelection';
import SpectrogramSelection from '../Components/SpectrogramSelection';
import BroadbandComponent from '../Components/BroadbandComponent';
import OverrideButton from '../Components/OverrideButton';
import DataSourceSelector from '../Components/DataSourceSelector';
import { Button } from '@heroui/button';
import { useContext, useEffect, useRef, useState } from 'react';
import { DetectionContext } from '../Contexts/DetectionContext';
import recordingParameters from '../../../../configs/recording_parameters.json';
import { ValidityContext } from '../Contexts/InputValidationContext';
import { useRecordingStatus } from '../Hooks/useRecordingStatus';
import { RecordingState } from '../enums/States';
import { usePositionSync } from '../Hooks/usePositionSync';
import { Image } from '@heroui/react';
import SMAUG from '/assets/icons/SMAUGlogo.png';
import WavFileList from '../Components/WavFileList';

const numOfChannels = recordingParameters['channels'];

const MainPage = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { connect: connectPositionSync, disconnect: disconnectPositionSync } =
    usePositionSync();

  const detectionContext = useContext(DetectionContext);

  const validityContext = useContext(ValidityContext);

  const { isRecording, connect, disconnect } = useRecordingStatus();

  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [recordingStop, setRecordingStop] = useState<number | null>(null);

  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // The default state of recording, this state is only active on first render
  const [recordingState, setRecordingState] = useState<RecordingState>(
    RecordingState.NotRecording
  );

  const prevRecordingRef = useRef<boolean>(false);

  if (!detectionContext) {
    throw new Error(
      'In MainPage.tsx: DetectionContext must be used within a DetectionContextProvider'
    );
  }

  if (!validityContext) {
    throw new Error(
      'In MainPage.tsx: ValidityContext must be used within a ValidityContextProvider'
    );
  }

  const { detection } = detectionContext;
  const { validity } = validityContext;

  // Effect for handling elapsing time when a recording starts to inform user of how long recording has gone
  useEffect(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (isRecording && isMonitoring && recordingStart) {
      setRecordingElapsed(Math.floor((Date.now() - recordingStart) / 1000));

      recordingTimerRef.current = setInterval(() => {
        if (recordingStart) {
          setRecordingElapsed(Math.floor((Date.now() - recordingStart) / 1000));
        }
      }, 1000);
    } else {
      setRecordingElapsed(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [isRecording, isMonitoring, recordingStart]);

  // effect for handling connection to recording status useRecordingStatus hook
  useEffect(() => {
    if (isMonitoring) {
      connect();
      connectPositionSync();
    } else {
      // When no longer monitoring, reset state
      setRecordingState(RecordingState.NotRecording);
      disconnect();
      disconnectPositionSync();
    }
  }, [
    connect,
    disconnect,
    connectPositionSync,
    disconnectPositionSync,
    isMonitoring,
  ]);

  // Effect for handling timestamps and recording states
  useEffect(() => {
    if (isRecording && !prevRecordingRef.current) {
      setRecordingState(RecordingState.Recording);
      setRecordingStart(Date.now());
      setRecordingStop(null);
    } else if (!isRecording && prevRecordingRef.current) {
      setRecordingState(RecordingState.StoppedRecording);
      setRecordingStop(Date.now());
    }

    prevRecordingRef.current = isRecording;
  }, [isRecording, recordingState]);

  // Function is only used for formatting elapsed time
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  const formatDuration = (start: number, stop: number) => {
    const diff = Math.floor((stop - start) / 1000); // in seconds
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex flex-col w-full h-screen p-2 lg:p-4">
      {/* Header with buttons and detection status */}
      <div className="flex justify-between items-center w-full mb-2 lg:mb-4 bg-slate-800 shadow-md shadow-slate-900 rounded-xl p-2 lg:p-4">
        <div className="w-1/4"></div>

        <div className="flex gap-2 lg:gap-4 items-center justify-center w-1/2">
          <Button
            color={isMonitoring ? 'danger' : 'success'}
            isDisabled={
              !validity.isSpectrogramConfigValid ||
              !validity.isBroadbandConfigValid
            }
            radius="sm"
            onPress={() => setIsMonitoring((prev) => !prev)}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
          <OverrideButton
            recordingStatus={isRecording}
            isMonitoring={isMonitoring}
          />
        </div>

        <div className="w-1/4 flex justify-end">
          <div className="relative">
            <WavFileList />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 grid-rows-2 gap-2 lg:gap-4 w-full flex-1 mt-4">
        <div className="overflow-auto rounded bg-slate-700 flex flex-col">
          <div className="flex-1">
            <SpectrogramSelection isMonitoring={isMonitoring} />
          </div>
          <div className="flex justify-center items-center p-4 gap-4">
            <div className="bg-gray-200 rounded-2xl p-4 shadow-lg ring-2 ring-blue-200 border border-blue-300 transition-transform hover:scale-105 duration-300 ease-in-out">
              <Image
                alt="EU Horizon SMAUG LOGO"
                src={SMAUG}
                height={140}
                width={140}
                className="rounded-xl"
              />
            </div>
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 p-3">
              <h3 className="text-gray-300 text-sm uppercase font-semibold mb-2 border-b border-slate-700 pb-1">
                System Status
              </h3>
              <div className="flex flex-col gap-2.5">
                {/* Narrowband status */}
                <div className="grid grid-cols-[120px_auto_1fr] items-center px-3 py-1.5 rounded-md bg-slate-800/70">
                  <span className="text-gray-300 font-medium">Narrowband:</span>
                  <div className="flex justify-center w-8">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        detection.narrowbandDetection && isMonitoring
                          ? 'bg-green-500 animate-pulse shadow-glow-green'
                          : !isMonitoring
                            ? 'bg-gray-400'
                            : 'bg-gray-500'
                      }`}
                    ></span>
                  </div>
                  <span
                    className={`font-medium ${
                      detection.narrowbandDetection && isMonitoring
                        ? 'text-green-400'
                        : !isMonitoring
                          ? 'text-gray-50'
                          : 'text-gray-300'
                    }`}
                  >
                    {detection.narrowbandDetection && isMonitoring
                      ? 'Detection'
                      : !isMonitoring
                        ? 'No data'
                        : 'No detection'}
                  </span>
                </div>

                {/* Broadband status */}
                <div className="grid grid-cols-[120px_auto_1fr] items-center px-3 py-1.5 rounded-md bg-slate-800/70">
                  <span className="text-gray-300 font-medium">Broadband:</span>
                  <div className="flex justify-center w-8">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        detection.broadbandDetections?.detections
                          .summarizedDetection && isMonitoring
                          ? 'bg-green-500 animate-pulse shadow-glow-green'
                          : !isMonitoring
                            ? 'bg-gray-400'
                            : 'bg-gray-500'
                      }`}
                    ></span>
                  </div>
                  <span
                    className={`font-medium ${
                      detection.broadbandDetections?.detections
                        .summarizedDetection && isMonitoring
                        ? 'text-green-400'
                        : !isMonitoring
                          ? 'text-gray-50'
                          : 'text-gray-300'
                    }`}
                  >
                    {detection.broadbandDetections?.detections
                      .summarizedDetection && isMonitoring
                      ? 'Detection'
                      : !isMonitoring
                        ? 'No data'
                        : 'No detection'}
                  </span>
                </div>

                {/* Recording status */}
                <div className="grid grid-cols-[120px_auto_1fr] items-center px-3 py-1.5 rounded-md bg-slate-800/70">
                  <span className="text-gray-300 font-medium">Recording:</span>
                  <div className="flex justify-center w-8">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        recordingState === RecordingState.Recording &&
                        isMonitoring
                          ? 'bg-red-500 animate-pulse shadow-glow-red'
                          : !isMonitoring ||
                              recordingState === RecordingState.NotRecording
                            ? 'bg-gray-400'
                            : 'bg-gray-500'
                      }`}
                    ></span>
                  </div>
                  <span
                    className={`font-medium ${
                      isRecording && isMonitoring
                        ? 'text-green-400'
                        : !isMonitoring ||
                            recordingState === RecordingState.NotRecording
                          ? 'text-gray-50'
                          : 'text-red-400'
                    }`}
                  >
                    {isRecording && isMonitoring
                      ? recordingStart &&
                        `${formatTime(recordingStart)} (${formatElapsedTime(recordingElapsed)})`
                      : !isMonitoring ||
                          recordingState === RecordingState.NotRecording
                        ? 'No audio'
                        : recordingStart &&
                          recordingStop &&
                          formatDuration(recordingStart, recordingStop)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of your grid remains the same */}
        <div className="relative overflow-auto rounded bg-slate-700">
          <MapComponent isMonitoring={isMonitoring} />
          <div className="absolute top-2 right-2 z-[1000]">
            <DataSourceSelector />
          </div>
        </div>
        <div className="overflow-auto rounded bg-slate-700">
          <div className="flex h-full gap-2 lg:gap-4">
            <div className="w-1/2">
              <WaveformSelection
                numChannels={numOfChannels}
                isMonitoring={isMonitoring}
              />
            </div>
            <div className="w-1/2">
              <BroadbandComponent isMonitoring={isMonitoring} />
            </div>
          </div>
        </div>
        <div className="overflow-auto rounded bg-slate-700">
          <AisDataTable isMonitoring={isMonitoring} />
        </div>
      </div>
    </div>
  );
};

export default MainPage;
