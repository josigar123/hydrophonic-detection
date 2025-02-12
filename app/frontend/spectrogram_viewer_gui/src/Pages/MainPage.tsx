import PlotView from '../Components/PlotView';
import AisDataTable from '../Components/AisDataTable';
import AmplitudeView from '../Components/AmplitudeView';
import MapComponent from '../Components/MapComponent';

const MainPage = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h2 className="flex-none p-2 text-gray-600">Themis</h2>
      {/* Top half */}
      <div className="flex-1 min-h-0">
        <div className="h-full grid grid-cols-2 gap-8 p-4">
          <div className="h-full overflow-hidden">
            <PlotView />
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
            <AmplitudeView />
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
