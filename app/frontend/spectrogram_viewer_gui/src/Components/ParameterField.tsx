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
      <div key={index} className="flex-1 min-w-0">
        {field.isDropdown ? (
          <Dropdown>
            <DropdownTrigger variant="faded">
              <Button className="w-full h-10 hover:bg-gray-200 truncate">
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
        ) : (
          <Input
            key={index}
            labelPlacement="inside"
            size="lg"
            label={field.name}
            className="w-full"
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
    <div className="w-full  rounded-xl bg-[#D9D9D9] p-4">
      <h3 className="text-lg font-medium mb-4">{fieldType}</h3>

      <div className="flex items-center space-x-2">
        <div className="flex-1 flex space-x-2 min-w-0">
          {RenderInputField(fields)}
        </div>
        <Button
          color="primary"
          size="lg"
          className="h-10 whitespace-nowrap"
          onPressStart={handleSubmit}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

export default ParameterField;
