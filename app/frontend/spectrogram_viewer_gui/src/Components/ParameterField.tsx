import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { postParameters } from '../api/ParameterOptions';
import { useState } from 'react';
import { SpectrogramContext } from '../Contexts/SpectrogramContext';
import { useContext } from 'react';

interface FormData {
  window_type: string | [string, number];
  n_samples: number;
  frequency_cutoff: number;
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

  const [formData, setFormData] = useState<FormData>({
    window_type: 'hann',
    n_samples: 5200,
    frequency_cutoff: 100,
    uri: uri,
  });

  const handleInputChange = (
    field: string,
    value: string | number | [string, number]
  ) => {
    setFormData((prev) => ({
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
          value={formData[fieldname as keyof FormData]?.toString() || ''}
          onChange={(e) => handleInputChange(fieldname, e.target.value)}
        />
      ));
  };

  const handleSubmit = async () => {
    try {
      const response = await postParameters('api/update-params', formData);

      const absolutePrefix =
        '/home/joseph/Skole/Bacherlor-Hydrofondeteksjon/source_code/hydrophonic-detection/hydrophonic-detection/app/frontend/spectrogram_viewer_gui/public';

      const relativePath = response.image_url.replace(absolutePrefix, '');

      spectrogramContext?.setSpectrogramURI(relativePath);
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
