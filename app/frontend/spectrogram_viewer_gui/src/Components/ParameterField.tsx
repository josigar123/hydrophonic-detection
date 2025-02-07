import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { postParametersSpectrogram } from '../api/parameterApi';
import { useState } from 'react';
import { SpectrogramContext } from '../Contexts/SpectrogramContext';
import { useContext } from 'react';

interface SpectrogramData {
  windowType: string;
  nSamples: number;
  frequencyCutoff: number;
  frequencyMax: number;
  spectrogramMin: number;
  uri: string;
}

interface ParameterFieldProps {
  fieldType: string;
  numberOfFields: number;
  fieldNamesInOrder: Array<string>;
  uri: string;
}

const ParameterField = ({
  fieldType,
  numberOfFields,
  fieldNamesInOrder,
  uri,
}: ParameterFieldProps) => {
  const spectrogramContext = useContext(SpectrogramContext);

  const [spectrogramData, setSpectrogramData] = useState<SpectrogramData>({
    windowType: 'hann',
    nSamples: 5200,
    frequencyCutoff: 100,
    frequencyMax: 1000,
    spectrogramMin: -40,
    uri: uri,
  });

  const handleSpectrogramInputChange = (
    field: string,
    value: string | number
  ) => {
    setSpectrogramData((prev) => ({
      ...prev,
      [field]: typeof value === 'number' ? value.toString() : value,
    }));
  };

  const RenderInputField = (
    numberOfFields: number,
    fieldNamesInOrder: Array<string>
  ) => {
    return fieldNamesInOrder
      .slice(0, numberOfFields)
      .map((fieldname, index) => (
        <Input
          key={index}
          labelPlacement="inside"
          size="lg"
          label={fieldname}
          className="w-32"
          value={
            // TODO: When DEMON analysis is available, add a ternary operator on fieldType to decide what fields to use e.g demonData, audioData etc
            spectrogramData[fieldname as keyof SpectrogramData]?.toString() ||
            ''
          }
          onChange={
            (e) => handleSpectrogramInputChange(fieldname, e.target.value) // TODO: When DEMON analysis is available, add a ternary operator on fieldType to decide what input change handler should be called
          }
        />
      ));
  };

  const handleSubmit = async () => {
    try {
      if (fieldType === 'Spectrogram') {
        spectrogramData.nSamples = Number(spectrogramData.nSamples); // TODO: n_samples gets sent as a string for whatever reason, look into this, or keep this stupid conversion

        const response = await postParametersSpectrogram(
          'SpectrogramReprocessor',
          spectrogramData
        );

        // Acts as a temporary url for the image, created from the blob data
        const spectrogramUrl = URL.createObjectURL(response.image_blob);

        spectrogramContext?.setSpectrogramUrl(spectrogramUrl);
      } else if (fieldType === 'DEMON') {
        console.log('Call DEMON endpoint');
      } else if (fieldType === 'Audio') {
        console.log('Call Audio endpoint');
      } else {
        console.error('Unknown fieldType');
        throw TypeError; // Should prob be ValueError
      }
    } catch (error) {
      console.error('Error submitting parameters:', error);
    }
  };

  return (
    <div className="flex justify-start items-center w-auto h-36 border-4 border-gray-800 rounded-3xl bg-[#D9D9D9] p-2 space-x-2 relative">
      <h3 className="absolute top-0 left-0 p-2 ml-4">{fieldType}</h3>
      {RenderInputField(numberOfFields, fieldNamesInOrder)}
      <Button
        color="primary"
        size="lg"
        className="absolute right-4"
        onPressStart={handleSubmit}
      >
        Apply
      </Button>
    </div>
  );
};

export default ParameterField;
