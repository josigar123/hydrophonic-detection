import AisDataTable from '../Components/AisDataTable';
import MapComponent from '../Components/MapComponent';
import WaveformSelection from '../Components/WaveformSelection';
import DataTransferTest from '../Components/DataTransferTest';
import ScrollingSpectrogram from '../Components/ScrollingSpectrogram';
import ImprovedWaveform from '../Components/ImprovedWaveform';
import SpectrogramSelection from '../Components/SpectrogramSelection';

const MainPage = () => {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 lg:gap-4 w-full h-screen p-2 lg:p-4">
      <div className="min-h-0 min-w-0 overflow-auto p-4 rounded">
        {/* <DataTransferTest></DataTransferTest> */}
        <ScrollingSpectrogram />
        {/* <SpectrogramSelection /> */}
      </div>
      <div className="min-h-0 min-w-0 overflow-auto p-4 rounded">
        {/*<MapComponent />*/}
      </div>
      <div className="min-h-0 min-w-0 overflow-auto p-4 rounded">
        <WaveformSelection numChannels={2} />
        {/* <ImprovedWaveform numChannels={2}></ImprovedWaveform> */}
      </div>
      <div className="min-h-0 min-w-0 overflow-auto p-4 rounded">
        {/*<AisDataTable />*/}
      </div>
    </div>
  );
};

export default MainPage;
