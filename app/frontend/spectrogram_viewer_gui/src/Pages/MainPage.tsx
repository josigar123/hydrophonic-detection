import AisDataTable from '../Components/AisDataTable';
import MapComponent from '../Components/MapComponent';
import WaveformSelection from '../Components/WaveformSelection';
import SpectrogramSelection from '../Components/SpectrogramSelection';
import BroadbandComponent from '../Components/BroadbandComponent';

const MainPage = () => {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 lg:gap-4 w-full h-screen p-2 lg:p-4">
      <div className="overflow-auto p-4 rounded h-full">
        <SpectrogramSelection />
      </div>
      <div className="overflow-auto p-4 rounded h-full">
        <MapComponent />
      </div>
      <div className="overflow-auto p-4 rounded h-full">
        <div className="flex h-full gap-2 lg:gap-4">
          <div className="w-1/2">
            <WaveformSelection numChannels={1} />
          </div>
          <div className="w-1/2">
            <BroadbandComponent />
          </div>
        </div>
      </div>
      <div className="overflow-auto p-4 rounded h-full">
        <AisDataTable />
      </div>
    </div>
  );
};

export default MainPage;
