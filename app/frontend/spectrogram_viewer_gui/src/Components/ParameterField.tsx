import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { postParametersSpectrogram } from '../api/parameterApi';
import { useState } from 'react';
import { SpectrogramContext } from '../Contexts/SpectrogramContext';
import { useContext } from 'react';
import { SpectrogramParameterRequestBody } from '../Interfaces/SpectrogramModels';

export interface FieldConfig {
  name: keyof SpectrogramParameterRequestBody;
  isDropdown: boolean;
  options?: string[];
}
interface ParameterFieldProps {
  fieldType: string;
  fields: FieldConfig[];
  uri: string;
}

const ParameterField = ({ fieldType, fields, uri }: ParameterFieldProps) => {
  const spectrogramContext = useContext(SpectrogramContext);

  const [spectrogramData, setSpectrogramData] =
    useState<SpectrogramParameterRequestBody>({
      windowType: '',
      nSegment: 0,
      highpassCutoff: 0,
      lowpassCutoff: 0,
      colorScaleMin: 0,
      maxDisplayedFrequency: 0,
      uri: uri,
    });

  const handleSpectrogramInputChange = (
    field: keyof SpectrogramParameterRequestBody,
    value: string | number
  ) => {
    setSpectrogramData((prev) => ({
      ...prev,
      [field]: typeof value === 'number' ? value.toString() : value,
    }));
  };

  const RenderInputField = (fields: FieldConfig[]) => {
    return fields.map((field, index) => (
      <div key={index}>
        {field.isDropdown ? (
          <div className="flex">
            <Dropdown>
              <DropdownTrigger variant="faded">
                <Button className="flex-1 relative left-0 w-32 h-16 hover:bg-gray-200">
                  {spectrogramData.windowType || 'Select window type'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                selectionMode="single"
                aria-label={field.name}
                onAction={(key) =>
                  handleSpectrogramInputChange(field.name, key.toString())
                }
              >
                <>
                  {field.options?.map((option) => (
                    <DropdownItem key={option}>{option}</DropdownItem>
                  ))}
                </>
              </DropdownMenu>
            </Dropdown>
          </div>
        ) : (
          <Input
            key={index}
            labelPlacement="inside"
            size="lg"
            label={field.name}
            className="w-32"
            value={spectrogramData[field.name]?.toString() || ''}
            onChange={(e) =>
              handleSpectrogramInputChange(field.name, e.target.value)
            }
          />
        )}
      </div>
    ));
  };

  const handleSubmit = async () => {
    try {
      if (fieldType === 'Spectrogram') {
        spectrogramData.nSegment = Number(spectrogramData.nSegment); // TODO: n_samples gets sent as a string for whatever reason, look into this, or keep this stupid conversion

        const response = await postParametersSpectrogram(
          'SpectrogramReprocessor',
          spectrogramData
        );

        // Acts as a temporary url for the image, created from the blob data
        const spectrogramUrl = URL.createObjectURL(response.imageBlob);

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
    <div className="flex flex-wrap items-center w-auto h-36  rounded-3xl bg-[#D9D9D9] p-2 space-x-2 relative">
      <h3 className="absolute top-0 left-0 p-2 ml-4">{fieldType}</h3>

      <div className="flex-1 min-w-0 flex justify-start space-x-2">
        {RenderInputField(fields)}
      </div>

      <Button
        color="primary"
        size="lg"
        className="flex-shrink-0"
        onPressStart={handleSubmit}
      >
        Apply
      </Button>
    </div>
  );
};

export default ParameterField;
