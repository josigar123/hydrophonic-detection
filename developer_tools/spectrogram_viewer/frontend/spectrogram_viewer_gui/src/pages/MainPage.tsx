import spectrogramImage from '../assets/spectrograms/Spectrogram-19thC.png';
import mapImage from '../assets/maps/AIS_map.png';
import { Tabs, Tab } from '@heroui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@heroui/table';

const MainPage = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex h-1/2 mx-4 mt-8 space-x-8">
        <div className="flex-1 relative">
          <Tabs
            key="bordered"
            aria-label="Graph choice"
            size="md"
            radius="full"
          >
            <Tab key="spectrogram" title="Spectrogram"></Tab>
            <Tab key="DEMON" title="DEMON"></Tab>
          </Tabs>
          <img
            src={spectrogramImage}
            alt="Spectrogram"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1">
          <img
            src={mapImage}
            alt="Map with AIS data"
            className="w-full h-full object-cover mt-10"
          />
        </div>
      </div>
      <div className=" flex flex-1 justify-end items-end px-4 mt-8">
        <div className="w-1/2 p-4  mb-80">
          <Table aria-label="Example static collection table">
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
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
