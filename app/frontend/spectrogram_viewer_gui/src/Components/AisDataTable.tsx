import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from '@heroui/react';
import { Ship } from './ShipMarker';
import { useShips } from '../Hooks/useShips';
import { getHaversineDistance } from '../Utils/distance';

const MAX_SHIPS = 40;

const AisDataTable = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const { ships, isLoading} = useShips();

  const closestMovingShips = useMemo(() => {
    const center: [number, number] = [59.2674, 10.4075];
    return ships
      .filter((ship) => parseFloat(ship.speed) > -1.0)
      .map((ship) => ({
        ...ship,
        distance: getHaversineDistance(
          ship.latitude,
          ship.longitude,
          center[0],
          center[1]
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_SHIPS);
  }, [ships]);

  const handleOpenModal = (ship: Ship) => {
    setSelectedShip(ship);
    onOpen();
  };
  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop={'transparent'}
        size={'xs'}
        placement={'top'}
        classNames={{
          backdrop: 'z-[1000]',
          wrapper: 'z-[1000]',
          base: 'z-[1000]',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-lg font-semibold">
                {selectedShip ? `Ship Details` : 'Ship Details'}
              </ModalHeader>
              <ModalBody>
                {selectedShip ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="font-bold">MMSI:</span>{' '}
                    <span>{selectedShip.mmsi}</span>
                    <span className="font-bold">Name:</span>{' '}
                    <span>{selectedShip.shipName}</span>
                    <span className="font-bold">Ship Type:</span>{' '}
                    <span>{selectedShip.shipType}</span>
                    <span className="font-bold">AIS Class:</span>{' '}
                    <span>{selectedShip.aisClass}</span>
                    <span className="font-bold">Callsign:</span>{' '}
                    <span>{selectedShip.callsign}</span>
                    <span className="font-bold">Speed:</span>{' '}
                    <span>{selectedShip.speed}</span>
                    <span className="font-bold">Destination:</span>{' '}
                    <span>{selectedShip.destination}</span>
                    <span className="font-bold">True Heading:</span>{' '}
                    <span>{selectedShip.trueHeading}</span>
                    <span className="font-bold">Length:</span>{' '}
                    <span>{selectedShip.length}</span>
                    <span className="font-bold">Breadth:</span>{' '}
                    <span>{selectedShip.breadth}</span>
                    <span className="font-bold">Latitude:</span>{' '}
                    <span>{selectedShip.latitude.toFixed(1)}</span>
                    <span className="font-bold">Longitude:</span>{' '}
                    <span>{selectedShip.longitude.toFixed(1)}</span>
                    <span className="font-bold">Course:</span>{' '}
                    <span>{selectedShip.course.toFixed(1)}</span>
                    <span className="font-bold">Last Updated:</span>{' '}
                    <span>{selectedShip.dateTimeUtc.toLocaleString()}</span>
                  </div>
                ) : (
                  <p>No ship selected</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="h-full flex flex-col bg-grey-400 items-justify rounded-lg p-4">
        <div className="h-0 flex-grow overflow-auto">
          <Table aria-label="Live AIS Data Table">
            <TableHeader>
              <TableColumn key="MMSI">MMSI</TableColumn>
              <TableColumn key="SHIP_TYPE">Type</TableColumn>
              <TableColumn key="Knots">Knots</TableColumn>
              <TableColumn key="Distance">Distance</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={isLoading}
              items={closestMovingShips}
              loadingContent={<Spinner label="Loading..." />}
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
                  <TableCell>{ship.shipType}</TableCell>
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
