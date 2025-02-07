import refreshIconImage from '/assets/icons/RefreshIcon.png';
import placeholderImage from '/assets/placeholders/977232.png';
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
import ParameterField from '../Components/ParameterField';

const MainPage = () => {
  const spectrogramContext = useContext(SpectrogramContext);

  const spectrogramFieldNames = [
    'windowType',
    'nSamples',
    'frequencyCutoff',
    'spectrogramMin',
    'frequencyMax',
  ];

  const audioFieldNames = ['Gain'];
  return (
    <div className="flex flex-col h-screen">
      <h2 className="absolute top-0 left-0 ml-2 text-gray-600">Themis</h2>
      {/* Top half */}
      <div className="flex-1">
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
                <div className="w-full h-full">
                  <img
                    src={spectrogramContext?.spectrogramUrl}
                    alt="An image of a standard spectrogram"
                    className="object-contain shadow-lg rounded-3xl mt-2"
                  />
                </div>
              </Tab>
              <Tab key="DEMON" title="DEMON">
                <div className="w-full h-full">
                  <img
                    src={placeholderImage}
                    alt="An image of a DEMON spectrogram"
                    className="object-contain shadow-lg rounded-3xl mt-2"
                  />
                </div>
              </Tab>
            </Tabs>
            <img
              src={placeholderImage}
              alt="An image of an amplitude plot against time"
              className="object-contain shadow-lg rounded-3xl mt-2"
            ></img>
            <div className="absolute top-0 right-0 mt-3 mr-4">
              <Tooltip
                placement="right"
                closeDelay={1}
                delay={1}
                content="Refreshes current graph, if a new one is available"
              >
                <Button size="sm" radius="full">
                  <img
                    src={refreshIconImage}
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
        <div className="flex-1">
          <ParameterField
            fieldType="Spectrogram"
            numberOfFields={spectrogramFieldNames.length}
            fieldNamesInOrder={spectrogramFieldNames}
            uri="db8278de83114c159fec7528aea5d646" // TODO, use the wavUri, and setWavUri so that this is dynamic and not hardcoded
          ></ParameterField>
          <ParameterField
            fieldType="Audio"
            numberOfFields={audioFieldNames.length}
            fieldNamesInOrder={audioFieldNames}
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
