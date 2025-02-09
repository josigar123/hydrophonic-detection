import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@heroui/table';

const AisDataTable = () => {
  return (
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
  );
};

export default AisDataTable;
