import recenterIcon from '/assets/icons/recenter.svg';
import placeholderImage from '/assets/placeholders/977232.png';
import amplitudePlot from '/assets/amplitude_plots/amplitudePlot.png';
import { Tabs, Tab } from '@heroui/tabs';
import { useContext } from 'react';
import { SpectrogramContext } from '../Contexts/SpectrogramContext';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@heroui/table';
import { Tooltip, Button } from '@heroui/react';
import { FieldConfig } from '../Components/ParameterField';
import ParameterField from '../Components/ParameterField';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const MainPage = () => {
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

  // Placeholders
  const audioFields: FieldConfig[] = [{ name: 'gain', isDropdown: false }];

  return (
    <div className="min-h-screen flex flex-col">
      <h2 className="absolute top-0 left-0 ml-2 text-gray-600">Themis</h2>
      {/* Top half */}
      <div className="flex-1 flex space-x-4 p-4">
        <div className="flex h-full mx-4 mt-8 space-x-8">
          <div className="flex-1 flex flex-col relative">
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
          </div>

          <div className="flex-1 relative">
            <div className="w-full h-full">
              <img
                src={placeholderImage}
                alt="Map with AIS data"
                className="object-contain shadow-lg rounded-3xl mt-14"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom half */}
      <div className="flex-1 flex justify-start items-start px-4 w-auto space-x-2 py-4">
        <div className="flex-1 bg-slate-400 p-4 space-y-2 rounded-lg">
          <img
            src={amplitudePlot}
            alt="An image of an amplitude plot against time"
            className="object-contain shadow-lg rounded-3xl mt-2"
          ></img>
          <ParameterField
            fieldType="Audio"
            fields={audioFields}
            uri="asjklhashjklasdhjk"
          ></ParameterField>
        </div>

        <div className="flex-1 relative">
          <Table aria-label="10 nearest AIS signals">
            <TableHeader>
              <TableColumn>MMSI</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>LATITUDE</TableColumn>
              <TableColumn>LONGITUDE</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow key="1">
                <TableCell>258584000</TableCell>
                <TableCell>7</TableCell>
                <TableCell>59.427761</TableCell>
                <TableCell>10.466560</TableCell>
              </TableRow>
              <TableRow key="2">
                <TableCell>258027670</TableCell>
                <TableCell>0</TableCell>
                <TableCell>59.391972</TableCell>
                <TableCell>10.481112</TableCell>
              </TableRow>
              <TableRow key="3">
                <TableCell>257846800</TableCell>
                <TableCell>0</TableCell>
                <TableCell>59.429482</TableCell>
                <TableCell>10.653664</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>231613000</TableCell>
                <TableCell>0</TableCell>
                <TableCell>59.459068</TableCell>
                <TableCell>10.509167</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>231613000</TableCell>
                <TableCell>0</TableCell>
                <TableCell>59.459068</TableCell>
                <TableCell>10.509167</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>231613000</TableCell>
                <TableCell>0</TableCell>
                <TableCell>59.459068</TableCell>
                <TableCell>10.509167</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>231613000</TableCell>
                <TableCell>0</TableCell>
                <TableCell>59.459068</TableCell>
                <TableCell>10.509167</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>231613000</TableCell>
                <TableCell>0</TableCell>
                <TableCell>59.459068</TableCell>
                <TableCell>10.509167</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>231613000</TableCell>
                <TableCell>0</TableCell>
                <TableCell>59.459068</TableCell>
                <TableCell>10.509167</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>231613000</TableCell>
                <TableCell>0</TableCell>
                <TableCell>59.459068</TableCell>
                <TableCell>10.509167</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
