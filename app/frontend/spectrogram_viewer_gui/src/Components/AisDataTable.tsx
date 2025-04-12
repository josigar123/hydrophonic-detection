import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Button,
  useDisclosure,
} from '@heroui/react';
import { Ship } from './ShipMarker';
import { getShipTypeDescription } from '../utils/shipTypes';
import { useClosestMovingShips } from '../Hooks/useClosestMovingShips';
import ShipDetailsModal from '../Components/ModalShipDetails';

interface AisDataTableProps {
  isMonitoring: boolean;
}

const AisDataTable = ({ isMonitoring }: AisDataTableProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const { closestMovingShips, isLoading } = useClosestMovingShips(isMonitoring);
  

  const handleOpenModal = (ship: Ship) => {
    setSelectedShip(ship);
    onOpen();
  };

  return (
    <>
      <ShipDetailsModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        ship={selectedShip}
      />
      <div className="h-full flex flex-col bg-grey-400 items-justify rounded-lg p-4">
        <div className="h-0 flex-grow overflow-auto">
          <Table
            aria-label="Live AIS Data Table"
            isVirtualized
            isHeaderSticky
            classNames={{
              wrapper: "max-h-[500px] overflow-auto scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent",
              table: "min-h-[320px]",
              base: "rounded-lg overflow-hidden",
            }}
          >
            <TableHeader>
              <TableColumn key="MMSI">MMSI</TableColumn>
              <TableColumn key="SHIP_TYPE">Type</TableColumn>
              <TableColumn key="Knots">Knots</TableColumn>
              <TableColumn key="Distance">Distance: Closest Moving Ships</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={isLoading}
              items={closestMovingShips}
              loadingContent={<Spinner color="primary" label="Loading..." />}
              emptyContent={"No ships found"}
            >
              {(ship: Ship & { distance: number }) => (
                <TableRow key={ship.mmsi}>
                  <TableCell>
                    <Button
                      color="default"
                      onPress={() => handleOpenModal(ship)}
                    >
                      {ship.mmsi}
                    </Button>
                  </TableCell>
                  <TableCell>{getShipTypeDescription(ship.shipType)}</TableCell>
                  <TableCell>{ship.speed}</TableCell>
                  <TableCell>{ship.distance.toFixed(1)} km</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default AisDataTable;
