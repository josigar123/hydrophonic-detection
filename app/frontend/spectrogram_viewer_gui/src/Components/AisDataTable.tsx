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
import { useShips } from '../Hooks/useShips';
import ShipDetailsModal from '../Components/ModalShipDetails';

interface AisDataTableProps {
  isMonitoring: boolean;
}

const AisDataTable = ({ isMonitoring }: AisDataTableProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const { ships, isLoading } = useShips(isMonitoring);

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
      {/* Added min-h-0 so the table can shrink inside grid cells */}
      <div className="h-full w-full min-h-0 flex flex-col bg-grey-400 rounded-lg">
        <div className="flex-1 w-full min-h-0">
          <Table
            aria-label="Live AIS Data Table"
            isVirtualized
            isHeaderSticky
            classNames={{
              wrapper:
                'h-full max-h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent',
              table: 'w-full h-full',
              base: 'rounded-lg overflow-hidden w-full h-full',
              tbody: 'w-full',
              tr: 'w-full',
            }}
          >
            <TableHeader>
              <TableColumn key="MMSI">MMSI</TableColumn>
              <TableColumn key="SHIP_TYPE">Type</TableColumn>
              <TableColumn key="Knots">Knots</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={isLoading}
              items={ships}
              loadingContent={<Spinner color="primary" label="Loading..." />}
              emptyContent={<div className="w-full text-center py-8">No ships found</div>}
            >
              {(ship: Ship) => (
                <TableRow key={ship.mmsi} className="w-full">
                  <TableCell>
                    <Button color="default" onPress={() => handleOpenModal(ship)}>
                      {ship.mmsi}
                    </Button>
                  </TableCell>
                  <TableCell>{getShipTypeDescription(ship.shipType)}</TableCell>
                  <TableCell>{ship.speed}</TableCell>
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
