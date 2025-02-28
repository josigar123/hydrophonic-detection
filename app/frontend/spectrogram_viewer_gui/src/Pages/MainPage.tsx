import PlotView from '../Components/PlotView';
import AisDataTable from '../Components/AisDataTable';
import MapComponent from '../Components/MapComponent';
import AudioRecorder from '../Components/AudioRecorder';

const MainPage = () => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      
      {/* Main content area - fills available space */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left column */}
        <div className="flex-1 flex flex-col min-h-0 p-2">
          {/* PlotView with fixed height for controls */}
          <div className="flex-1 overflow-auto mb-2 flex flex-col">
            {/* Set a minimum height to ensure it's visible, but allows growth */}
            <div className="min-h-[300px] md:min-h-[400px] flex-1">
              <PlotView />
            </div>
          </div>
          
          {/* AudioRecorder - adjust height to balance with PlotView */}
          <div className="h-[250px] overflow-hidden">
            <AudioRecorder />
          </div>
        </div>
        
        {/* Right column */}
        <div className="flex-1 flex flex-col min-h-0 p-2">
          {/* Map with good vertical space */}
          <div className="flex-1 mb-2 overflow-hidden min-h-[300px]">
            <MapComponent />
          </div>
          
          {/* AIS Data Table */}
          <div className="h-[250px] overflow-auto">
            <AisDataTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;