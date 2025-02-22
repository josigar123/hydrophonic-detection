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

const getHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180.0;
  const dLng = (lng2 - lng1) * Math.PI / 180.0;

  lat1 = (lat1) * Math.PI / 180.0;
  lat2 = (lat2) * Math.PI / 180.0;

  const halfChordSquared = Math.pow(Math.sin(dLat / 2), 2) +
            Math.pow(Math.sin(dLng / 2), 2) *
            Math.cos(lat1) *
            Math.cos(lat2);
  const angularDistance = 2 * Math.asin(Math.sqrt(halfChordSquared));

  const haversineDistance = earthRadius * angularDistance;

  return haversineDistance;
}

const AisDataTable = () => {
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
