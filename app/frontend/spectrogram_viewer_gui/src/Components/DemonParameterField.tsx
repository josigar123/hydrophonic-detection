import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { useState } from 'react';

interface DemonSpectrogramParameters {
  demonSampleFrequency: number;
  tperseg: number;
  frequencyFilter: number;
  horizontalFilterLength: number;
  window: string;
}

const validWindowTypes = [
  'hann',
  'hamming',
  'blackman',
  'boxcar',
  'bartlett',
  'flattop',
  'parzen',
  'bohman',
  'blackmanharris',
  'nuttall',
  'barthann',
  'cosine',
  'exponential',
  'tukey',
  'taylor',
  'lanczos',
];

const DemonSpectrogramParameterField = () => {
  const [spectrogramParams, setSpectrogramParams] =
    useState<DemonSpectrogramParameters>({
      demonSampleFrequency: 200,
      tperseg: 256,
      frequencyFilter: 500,
      horizontalFilterLength: 10,
      window: 'hann',
    });

  const handleDropdownChange = (window: string) => {
    setSpectrogramParams((prevParams) => ({
      ...prevParams,
      window,
    }));
  };

  const handleInputChange = (
    field: keyof DemonSpectrogramParameters,
    value: string
  ) => {
    setSpectrogramParams((prevParams) => ({
      ...prevParams,
      [field]: isNaN(Number(value)) ? value : Number(value),
    }));
  };

  return (
    <div className="flex-1 min-w-0">
      <Dropdown>
        <DropdownTrigger variant="faded">
          <Button className="w-full h-10 hover:bg-gray-200 truncate">
            {spectrogramParams?.window || 'Select window type'}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          disallowEmptySelection
          selectionMode="single"
          aria-label="Window"
          onAction={(window) => handleDropdownChange(window.toString())}
        >
          {validWindowTypes.map((window) => (
            <DropdownItem key={window}>{window}</DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      <Input
        labelPlacement="inside"
        label="demonSampleFreq"
        className="w-full"
        value={spectrogramParams?.tperseg.toString() || ''}
        onChange={(e) =>
          handleInputChange('demonSampleFrequency', e.target.value)
        }
      />
      <Input
        labelPlacement="inside"
        label="tperseg"
        className="w-full"
        value={spectrogramParams?.tperseg.toString() || ''}
        onChange={(e) => handleInputChange('tperseg', e.target.value)}
      />
      <Input
        labelPlacement="inside"
        label="freqFilt"
        className="w-full"
        value={spectrogramParams?.frequencyFilter.toString() || ''}
        onChange={(e) => handleInputChange('frequencyFilter', e.target.value)}
      />
      <Input
        labelPlacement="inside"
        label="hfiltLength"
        className="w-full"
        value={spectrogramParams?.horizontalFilterLength.toString() || ''}
        onChange={(e) =>
          handleInputChange('horizontalFilterLength', e.target.value)
        }
      />
    </div>
  );
};

export default DemonSpectrogramParameterField;
