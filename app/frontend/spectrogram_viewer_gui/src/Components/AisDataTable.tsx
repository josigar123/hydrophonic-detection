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

const AisDataTable = (ship : Ship) => {

  const [ships, setShips] = useState<Ship[]>([]);
  const [closeShips, setClosestShips] = useState([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
 
  return (
      <Table aria-label="Live AIS Data Table">
        <TableHeader>
          <TableColumn key="MMSI">MMSI</TableColumn>
          <TableColumn key="SHIP_NAME">Ship Name</TableColumn>
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
              <TableCell>{ship.latitude.toFixed(6)}</TableCell>
              <TableCell>{ship.longitude.toFixed(6)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  );
};

export default AisDataTable;
