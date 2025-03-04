import PlotView from '../Components/PlotView';
import AisDataTable from '../Components/AisDataTable';
import MapComponent from '../Components/MapComponent';
import AudioRecorder from '../Components/AudioRecorder';
import SpectrogramView from '../Components/SpectrogramView';

const MainPage = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <h2 className="flex-none p-2 text-gray-600">Themis</h2>
      {/* Top half */}
      <div className="flex-1 min-h-0">
        <div className="h-full grid grid-cols-2 gap-8 p-4">
          <div className="h-full overflow-hidden">
            {/*<PlotView />*/}
            <SpectrogramView />
          </div>
          <div className="h-full overflow-hidden">
            <MapComponent />
          </div>
        </div>
      </div>

      {/* Bottom half */}
      <div className="flex-1 min-h-0">
        <div className="h-full grid grid-cols-2 gap-8 p-4">
          <div className="h-full overflow-hidden">
            <AudioRecorder />
          </div>
          <div className="h-full overflow-hidden">
            <AisDataTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
