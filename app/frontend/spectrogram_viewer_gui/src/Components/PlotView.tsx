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
    { name: 'nSamples', isDropdown: false },
    { name: 'frequencyCutoff', isDropdown: false },
    { name: 'frequencyMax', isDropdown: false },
    { name: 'spectrogramMin', isDropdown: false },
  ];

  // Not relevant params, just placeholders
  const demonFields: FieldConfig[] = [
    { name: 'windowType', isDropdown: true, options: validWindowTypes },
    { name: 'nSamples', isDropdown: false },
    { name: 'frequencyCutoff', isDropdown: false },
    { name: 'frequencyMax', isDropdown: false },
    { name: 'spectrogramMin', isDropdown: false },
  ];

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="absolute top-0 right-0 mt-3 mr-4">
        <Tooltip
          placement="right"
          closeDelay={1}
          delay={1}
          content="Reset zoom"
        >
          <Button size="sm" radius="full">
            <img
              src={recenterIcon}
              alt="Image of a refresh icon"
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
        className="ml-4"
      >
        <Tab key="spectrogram" title="Spectrogram">
          <div className="w-full h-full bg-slate-400 rounded-lg space-y-2 p-4">
            <TransformWrapper initialScale={1} minScale={1} maxScale={5}>
              <TransformComponent>
                <img
                  src={spectrogramContext?.spectrogramUrl}
                  alt="An image of a standard spectrogram"
                  className="object-contain shadow-lg rounded-3xl mt-2"
                />
              </TransformComponent>
            </TransformWrapper>

            <ParameterField
              fieldType="Spectrogram"
              fields={spectrogramFields}
              uri="db8278de83114c159fec7528aea5d646" // TODO, use the wavUri, and setWavUri so that this is dynamic and not hardcoded
            ></ParameterField>
          </div>
        </Tab>
        <Tab key="DEMON" title="DEMON">
          <div className="w-full h-full bg-slate-400 rounded-lg space-y-2 p-4">
            <img
              src={placeholderImage}
              alt="An image of a DEMON spectrogram"
              className="object-contain shadow-lg rounded-3xl mt-2"
            />

            <ParameterField
              fieldType="DEMON"
              fields={demonFields}
              uri="asdfasdfasraw3ra3r"
            ></ParameterField>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default PlotView;
