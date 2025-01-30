import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import postParameters from './api';
import { useState } from 'react';

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
}

const ParameterField = ({
  fieldType,
  numberOfFields,
  fieldNamesInOrder,
}: ParameterFieldProps) => {
  const [formData, setFormData] = useState<FormData>({
    window_type: '',
    n_samples: 0,
    frequency_cutoff: 0,
    uri: '',
  });

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
        />
      ));
  };

  return (
    <div className="flex justify-start items-center w-auto h-36 border-4 border-gray-800 rounded-3xl bg-[#D9D9D9] p-2 space-x-2 relative">
      <h3 className="absolute top-0 left-0 p-2 ml-4">{fieldType}</h3>
      {RenderInputField(numberOfFields, fieldNamesInOrder)}
      <Button color="primary" size="lg" className="absolute right-4">
        Apply
      </Button>
    </div>
  );
};

export default ParameterField;
