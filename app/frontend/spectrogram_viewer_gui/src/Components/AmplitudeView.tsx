import amplitudePlot from '/assets/amplitude_plots/amplitudePlot.png';
import ParameterField, { FieldConfig } from '../Components/ParameterField';

const AmplitudeView = () => {
  // Placeholder
  const audioFields: FieldConfig[] = [{ name: 'gain', isDropdown: false }];

  return (
    <div className="flex-1 bg-slate-400 p-4 space-y-2 rounded-lg">
      <img
        src={amplitudePlot}
        alt="An image of an amplitude plot against time"
        className="object-contain shadow-lg rounded-xl mt-2"
      ></img>
      <ParameterField
        fieldType="Audio"
        fields={audioFields}
        uri="asjklhashjklasdhjk"
      ></ParameterField>
    </div>
  );
};

export default AmplitudeView;
