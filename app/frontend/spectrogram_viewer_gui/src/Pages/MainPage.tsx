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
//import RecordingStatusIndicator from '../Components/RecordingStatusIndicator';

const numOfChannels = recordingParameters['channels'];

const MainPage = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);

  usePositionSync('ws://localhost:8766?client_name=position_client', 25);

  const detectionContext = useContext(DetectionContext);

  const validityContext = useContext(ValidityContext);

  const { isRecording, connect, disconnect } = useRecordingStatus();

  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [recordingStop, setRecordingStop] = useState<number | null>(null);

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

  useEffect(() => {
    if (isMonitoring) {
      connect();
    } else {
      disconnect();
    }
  }, [connect, disconnect, isMonitoring]);

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
      <div className="flex justify-between w-full mb-2 lg:mb-4 bg-slate-800 shadow-md shadow-slate-900 rounded-xl p-2 lg:p-4">
        {/* Empty div for flex alignment */}
        <div className="w-1/4"></div>

        {/* Centered buttons */}
        <div className="flex gap-2 lg:gap-4 items-center">
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

          <OverrideButton />
        </div>

        <div className="flex items-center justify-end gap-2 w-1/4">
          {detection.narrowbandDetection ? (
            <span className="inline-flex items-center text-green-500">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse "></span>
              Detection in narrowband
            </span>
          ) : (
            <span className="inline-flex items-center text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
              No detection in narrowband
            </span>
          )}
          <span className="text-gray-400">|</span>

          {detection.broadbandDetections?.detections.summarizedDetection ? (
            <span className="inline-flex items-center text-green-500">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Detection in broadband
            </span>
          ) : (
            <span className="inline-flex items-center text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
              No detection in broadband
            </span>
          )}
          <span className="text-gray-400">|</span>
          {isRecording ? (
            <span className="inline-flex items-center text-green-500">
              <span className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
              Recording started at:{' '}
              {recordingStart && formatTime(recordingStart)}
            </span>
          ) : recordingState === RecordingState.NotRecording ? (
            <span className="inline-flex items-center text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
              Not recording
            </span>
          ) : (
            <span className="inline-flex items-center text-red-500">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
              Recording stopped at: {recordingStop && formatTime(recordingStop)}
              , duration:{' '}
              {recordingStart &&
                recordingStop &&
                formatDuration(recordingStart, recordingStop)}
            </span>
          )}
        </div>
      </div>

      {/* Main grid layout that fills remaining space */}
      <div className="grid grid-cols-2 grid-rows-2 gap-2 lg:gap-4 w-full flex-1 mt-4">
        <div className="overflow-auto rounded bg-slate-700">
          <SpectrogramSelection isMonitoring={isMonitoring} />
        </div>
        <div className="relative overflow-auto rounded bg-slate-700">
          <MapComponent />
          <div className="absolute top-2 right-2 z-[1000]">
            {' '}
            {/* Adjust top-?, right-?, z-? as needed */}
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
          <AisDataTable />
        </div>
      </div>
    </div>
  );
};

export default MainPage;
