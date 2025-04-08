import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
  } from '@heroui/react';
  import { Ship } from './ShipMarker';
  import { getShipTypeDescription } from '../Utils/shipTypes';
  
  interface ModalShipDetailsProps {
    isOpen: boolean;
    onOpenChange: () => void;
    ship: Ship | null;
  }
  
  const ModalShipDetails = ({ isOpen, onOpenChange, ship }: ModalShipDetailsProps) => {
    return (
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop={'transparent'}
        size={'xs'}
        placement={'auto'}
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
                {ship ? `Ship Details` : 'Ship Details'}
              </ModalHeader>
              <ModalBody>
                {ship ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="font-bold">MMSI:</span>{' '}
                    <span>{ship.mmsi}</span>
                    <span className="font-bold">Name:</span>{' '}
                    <span>{ship.shipName}</span>
                    <span className="font-bold">Ship Type:</span>{' '}
                    <span>{getShipTypeDescription(ship.shipType)}</span>
                    <span className="font-bold">AIS Class:</span>{' '}
                    <span>{ship.aisClass}</span>
                    <span className="font-bold">Callsign:</span>{' '}
                    <span>{ship.callsign}</span>
                    <span className="font-bold">Speed:</span>{' '}
                    <span>{ship.speed}</span>
                    <span className="font-bold">Destination:</span>{' '}
                    <span>{ship.destination}</span>
                    <span className="font-bold">True Heading:</span>{' '}
                    <span>{ship.trueHeading}</span>
                    <span className="font-bold">Length:</span>{' '}
                    <span>{ship.length}</span>
                    <span className="font-bold">Breadth:</span>{' '}
                    <span>{ship.breadth}</span>
                    <span className="font-bold">Latitude:</span>{' '}
                    <span>{ship.latitude.toFixed(1)}</span>
                    <span className="font-bold">Longitude:</span>{' '}
                    <span>{ship.longitude.toFixed(1)}</span>
                    <span className="font-bold">Course:</span>{' '}
                    <span>{ship.course.toFixed(1)}</span>
                    <span className="font-bold">Last Updated:</span>{' '}
                    <span>{ship.dateTimeUtc.toLocaleString()}</span>
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
    );
  };
  
  export default ModalShipDetails;