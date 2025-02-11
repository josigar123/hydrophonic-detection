import PlotView from '../Components/PlotView';
import AisDataTable from '../Components/AisDataTable';
import AmplitudeView from '../Components/AmplitudeView';
import MapComponent from '../Components/MapComponent';

const MainPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <h2 className="absolute top-0 left-0 ml-2 text-gray-600">Themis</h2>
      {/* Top half */}
      <div className="flex-1 flex p-4 h-full space-x-4">
        <div className="flex h-full mx-4 mt-8 space-x-8">
          <PlotView />
          <MapComponent />
        </div>
      </div>

      {/* Bottom half */}
      <div className="flex-1 flex justify-start items-start px-4 w-auto space-x-2 py-4">
        <AmplitudeView />
        <div className="flex-1 relative">
          <AisDataTable />
        </div>
      </div>
    </div>
  );
};

export default MainPage;
