import { useState, useEffect, useRef } from 'react';
import { Ship } from '../Components/ShipMarker';

export const useShips = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const websocket = useRef<WebSocket | null>(null)

  const shipPositions = useRef <Record<string, [number, number][]>>({});
  const shipMetaData = useRef <Record<string, Partial<Ship>>>({})

  const reconnectAttempts = useRef<number>(0)
  const maxReconnectAttempts = 10;
  const reconnectDelay = useRef<number>(1000);

  const connectWebSocket = () => {
    const wsUrl = 'ws://localhost:8766?client_name=map_client'

    if(websocket.current && websocket.current.readyState !== WebSocket.CLOSED) {
      console.log('Websocket is already connected or connecting');
      return;
    }
    console.log(`Connecting to WebSocket (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
    websocket.current = new WebSocket(wsUrl);

    websocket.current.onopen = () => {
      console.log('WebSocket connection established');
      setIsLoading(false);
      setError(null);
      reconnectAttempts.current = 0;
      reconnectDelay.current = 0;
    };

    websocket.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        handleWebSocketMessage(message);
        setLastUpdate(new Date());
      }
      catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    websocket.current.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Connection error with the AIS data server');
    };

    websocket.current.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);

      if(!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        reconnectDelay.current = Math.min(30000, reconnectDelay.current * 1.5);
        console.log(`Reconnecting in ${reconnectDelay.current / 1000}s...`);
        setTimeout(connectWebSocket, reconnectDelay.current);

      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Maxiumum reconnection attempts reached. Please refresh the page.')
      }
    };
  };

  const handleWebSocketMessage = (message:any) => {
    switch(message.type) {
      case 'position_update':
        updateShipPosition(message);
        break;

      case 'ship_info':
        updateShipInfo(message);
        break;

      case 'batch_update':
        if(Array.isArray(message.ships)) {
          message.ships.forEach((shipUpdate: any) => {
            updateShipPosition(shipUpdate);
          });
        }
        break;

        default:
          if (message.mmsi && (message.latitude != undefined || message.longitude != undefined)) {
            updateLegacyFormat(message);
          }
          break;
    }
  };

  const updateShipPosition = (data: any) => {
    if(!data.mmsi || !data.coordinates) return;


    const mmsi = data.mmsi;
    const latitude = data.coordinates.latitude;
    const longitude = data.coordinates.longitude;


    if(!shipPositions.current[mmsi]) {
      shipPositions.current[mmsi] = [];
    }

    shipPositions.current[mmsi].push([latitude, longitude])

    if(shipPositions.current[mmsi].length > 100) {
      shipPositions.current[mmsi].shift();
    }

    setShips(prevShips => {
      const existingIndex = prevShips.findIndex(ship => ship.mmsi === mmsi);

      if(existingIndex !== -1) {
        const updatedShips = [...prevShips];
        updatedShips[existingIndex] = {
          ...updatedShips[existingIndex],
          latitude,
          longitude,
          course: data.navigation?.course || updatedShips[existingIndex].course,
          speed: data.navigation?.speed?.toString() || updatedShips[existingIndex].speed,
          trueHeading: data.navigation?.heading?.toString() || updatedShips[existingIndex].trueHeading,
          path: shipPositions.current[mmsi],
          dateTimeUtc: new Date(data.timestamp ? data.timestamp * 1000 : Date.now())
        };
        return updatedShips;
      } else {
        const metadata = shipMetaData.current[mmsi] || {};

        const newShip: Ship = {
          mmsi,
          shipName: metadata.shipName || 'Unknown',
          shipType: metadata.shipType || 'Unknown',
          aisClass: metadata.aisClass || 'A',
          callsign: metadata.callsign || '',
          speed: data.navigation?.speed?.toString() || '0',
          destination: metadata.destination || 'Unknown',
          trueHeading: data.navigation?.heading?.toString() || '0',
          length: metadata.length || '0',
          breadth: metadata.breadth || '0',
          latitude,
          longitude,
          course: data.navigation?.course || 0,
          dateTimeUtc: new Date(data.timestamp ? data.timestamp * 1000 : Date.now()),
          path: shipPositions.current[mmsi]
        };
        return [...prevShips, newShip];
      }
    });
  };

  const updateShipInfo = (data: any) => {
    if (!data.mmsi) return;

    const mmsi = data.mmsi;

    shipMetaData.current[mmsi] = {
      ...shipMetaData.current[mmsi],
      shipName: data.name || 'Unknown',
      callsign: data.callsign || '',
      shipType: data.ship_type?.toString() || 'Unknown',
      destination: data.destination || 'Unknown',
      length: data.dimensions?.length?.toString() || '0',
      breadth: data.dimensions?.width?.toString() || '0'
    };

    setShips(prevShips => {
      const existingIndex = prevShips.findIndex(ship => ship.mmsi === mmsi);
      
      if (existingIndex !== -1) {
        const updatedShips = [...prevShips];
        updatedShips[existingIndex] = {
          ...updatedShips[existingIndex],
          ...shipMetaData.current[mmsi]
        };
        return updatedShips;
      }
      return prevShips;
    });
  };

  const updateLegacyFormat = (data: any) => {
    const mmsi = data.mmsi;

    if (data.latitude !== undefined && data.longitude !== undefined) {
      if (!shipPositions.current[mmsi]) {
        shipPositions.current[mmsi] = [];
      }
      
      shipPositions.current[mmsi].push([data.latitude, data.longitude]);

      if (shipPositions.current[mmsi].length > 100) {
        shipPositions.current[mmsi].shift();
      }
    }
    setShips(prevShips => {
      const existingIndex = prevShips.findIndex(ship => ship.mmsi === mmsi);
      
      if (existingIndex !== -1) {
        const updatedShips = [...prevShips];
        updatedShips[existingIndex] = {
          ...updatedShips[existingIndex],
          ...mapLegacyAisToShip(data),
          path: shipPositions.current[mmsi] || []
        };
        return updatedShips;
      } else {
        return [...prevShips, {
          ...mapLegacyAisToShip(data),
          path: shipPositions.current[mmsi] || []
        }];
      }
    });
  };

  const mapLegacyAisToShip = (aisData: any): Ship => {
    return {
      mmsi: aisData.mmsi || '',
      shipName: aisData.name || 'Unknown',
      shipType: aisData.ship_type?.toString() || 'Unknown',
      aisClass: aisData.message_type === 18 ? 'B' : 'A',
      callsign: aisData.callsign || '',
      speed: aisData.speed?.toString() || '0',
      destination: aisData.destination || 'Unknown',
      trueHeading: aisData.heading?.toString() || '0',
      length: aisData.dimension_to_bow + aisData.dimension_to_stern || '0',
      breadth: aisData.dimension_to_port + aisData.dimension_to_starboard || '0',
      latitude: aisData.latitude || 0,
      longitude: aisData.longitude || 0,
      dateTimeUtc: new Date(aisData.timestamp ? aisData.timestamp * 1000 : Date.now()),
      course: aisData.course || 0,
      path: []
    };
  };


  useEffect(() => {
    connectWebSocket();

    return() => {
      if(websocket.current) {
        websocket.current.close();
      }
    };
  }, []);

  return {
    ships,
    isLoading,
    error,
    lastUpdate
  };
};