import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
} from "@heroui/react";
import { Ship } from "./ShipMarker";
import FetchAis from FetchAis;



const MAX_SHIPS = 10;

const AisDataTable: React.FC = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to fetch AIS data
  parsedShips = fetchAis();
  setShips(parsedShips);
  setIsLoading(false);
 
  return (

      <Table aria-label="Live AIS Data Table">
        <TableHeader>
          <TableColumn key="MMSI">MMSI</TableColumn>
          <TableColumn key="SHIP_NAME">Ship Name</TableColumn>
          <TableColumn key="STATUS">STATUS</TableColumn>
          <TableColumn key="LATITUDE">LATITUDE</TableColumn>
          <TableColumn key="LONGITUDE">LONGITUDE</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          items={ships}
          loadingContent={<Spinner label="Loading..." />}
        >
          {(ship: Ship) => (
            <TableRow key={ship.mmsi}>
              <TableCell>{ship.mmsi}</TableCell>
              <TableCell>{ship.shipName}</TableCell>
              <TableCell>{ship.STATUS}</TableCell>
              <TableCell>{ship.LATITUDE.toFixed(6)}</TableCell>
              <TableCell>{ship.LONGITUDE.toFixed(6)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  );
};

export default AisDataTable;
