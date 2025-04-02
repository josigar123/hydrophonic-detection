import AisDataTable from '../Components/AisDataTable';
import MapComponent from '../Components/MapComponent';
import WaveformSelection from '../Components/WaveformSelection';
import SpectrogramSelection from '../Components/SpectrogramSelection';
import BroadbandComponent from '../Components/BroadbandComponent';
import OverrideButton from '../Components/OverrideButton';
import DataSourceSelector from '../Components/DataSourceSelector';

const MainPage = () => {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 lg:gap-4 w-full h-screen p-2 lg:p-4">
      <div className="overflow-auto p-4 rounded h-full">
        <SpectrogramSelection />
      </div>
      <div className="overflow-auto p-4 rounded h-full">
        <OverrideButton/>
        <DataSourceSelector/>
        <MapComponent />
      </div>
      <div className="overflow-auto p-4 rounded h-full">
        <div className="flex h-full gap-2 lg:gap-4">
          <div className="w-1/2">
            <WaveformSelection numChannels={4} />
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
