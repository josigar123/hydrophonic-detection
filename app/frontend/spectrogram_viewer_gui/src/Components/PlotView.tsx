import placeholderImage from '/assets/placeholders/977232.png';
import { Tabs, Tab } from '@heroui/tabs';
import { useContext } from 'react';
import { SpectrogramContext } from '../Contexts/SpectrogramContext';
import { FieldConfig } from '../Components/ParameterField';
import ParameterField from '../Components/ParameterField';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Tooltip } from '@heroui/tooltip';
import { Button } from '@heroui/button';
import recenterIcon from '/assets/icons/recenter.svg';

const PlotView = () => {
  const spectrogramContext = useContext(SpectrogramContext);

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

  const spectrogramFields: FieldConfig[] = [
    { name: 'windowType', isDropdown: true, options: validWindowTypes },
    { name: 'nSegment', isDropdown: false },
    { name: 'highpassCutoff', isDropdown: false },
    { name: 'lowpassCutoff', isDropdown: false },
    { name: 'colorScaleMin', isDropdown: false },
    { name: 'maxDisplayedFrequency', isDropdown: false },
  ];

  // Not relevant params, just placeholders
  const demonFields: FieldConfig[] = [
    { name: 'windowType', isDropdown: true, options: validWindowTypes },
    { name: 'nSegment', isDropdown: false },
    { name: 'highpassCutoff', isDropdown: false },
    { name: 'lowpassCutoff', isDropdown: false },
    { name: 'colorScaleMin', isDropdown: false },
    { name: 'maxDisplayedFrequency', isDropdown: false },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="relatove top-2 right-2 z-10">
        <Tooltip
          placement="right"
          closeDelay={1}
          delay={1}
          content="Reset zoom"
        >
          <Button size="sm" radius="lg">
            <img
              src={recenterIcon}
              alt="Image of a recenter icon"
              className="w-6 h-6"
            />
          </Button>
        </Tooltip>
      </div>
      <Tabs
        key="bordered"
        aria-label="Graph choice"
        size="md"
        radius="full"
        className="h-full flex flex-col"
      >
        <Tab key="spectrogram" title="Spectrogram">
          <div className="h-full flex flex-col bg-slate-400 rounded-lg p-4">
            <div className="flex-1 min-h-0 overflow-auto flex justify-center items-center mb-4">
              <img
                src={spectrogramContext?.spectrogramUrl}
                alt="An image of a standard spectrogram"
                className="max-w-full max-h-full object-contain shadow-lg rounded-xl"
              />
            </div>
            <div className="flex-none">
              <ParameterField
                fieldType="Spectrogram"
                fields={spectrogramFields}
                uri="db8278de83114c159fec7528aea5d646" // TODO, use the wavUri, and setWavUri so that this is dynamic and not hardcoded
              ></ParameterField>
            </div>
          </div>
        </Tab>
        <Tab key="DEMON" title="DEMON">
          <div className="h-full flex flex-col bg-slate-400 rounded-lg p-4">
            <div className="flex-1 min-h-0 overflow-hidden mb-4">
              <img
                src={placeholderImage}
                alt="An image of a DEMON spectrogram"
                className="w-full h-full object-contain shadow-lg rounded-xl"
              />
            </div>
            <div className="flex-none">
              <ParameterField
                fieldType="DEMON"
                fields={demonFields}
                uri="asdfasdfasraw3ra3r"
              ></ParameterField>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default PlotView;
