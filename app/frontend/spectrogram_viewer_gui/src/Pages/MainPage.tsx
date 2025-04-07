import AisDataTable from '../Components/AisDataTable';
import MapComponent from '../Components/MapComponent';
import WaveformSelection from '../Components/WaveformSelection';
import SpectrogramSelection from '../Components/SpectrogramSelection';
import BroadbandComponent from '../Components/BroadbandComponent';
import OverrideButton from '../Components/OverrideButton';
import DataSourceSelector from '../Components/DataSourceSelector';
import { Button } from '@heroui/button';
import { useContext, useState } from 'react';
import { DetectionContext } from '../Contexts/DetectionContext';
import recordingParameters from '../../../../configs/recording_parameters.json';
import { ValidityContext } from '../Contexts/InputValidationContext';

const numOfChannels = recordingParameters['channels'];

const MainPage = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const detectionContext = useContext(DetectionContext);

  const validityContext = useContext(ValidityContext);

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

          {detection.broadbandDetection ? (
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
        </div>
      </div>

      {/* Main grid layout that fills remaining space */}
      <div className="grid grid-cols-2 grid-rows-2 gap-2 lg:gap-4 w-full flex-1 mt-4">
        <div className="overflow-auto rounded bg-slate-700">
          <SpectrogramSelection isMonitoring={isMonitoring} />
        </div>
        <div className="overflow-auto rounded bg-slate-700">
          <DataSourceSelector />
          <MapComponent />
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
