import placeholderImage from '/assets/placeholders/977232.png';
import PlotView from '../Components/PlotView';
import AisDataTable from '../Components/AisDataTable';
import AmplitudeView from '../Components/AmplitudeView';

const MainPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <h2 className="absolute top-0 left-0 ml-2 text-gray-600">Themis</h2>
      {/* Top half */}
      <div className="flex-1 flex p-4 h-full space-x-4">
        <div className="flex h-full mx-4 mt-8 space-x-8">
          <PlotView />
          <div className="flex-1 w-full h-full bg-slate-400 rounded-lg space-y-2 p-4">
            <img
              src={placeholderImage}
              alt="Map with AIS data"
              className="object-contain shadow-lg rounded-3xl mt-14"
            />
          </div>
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
