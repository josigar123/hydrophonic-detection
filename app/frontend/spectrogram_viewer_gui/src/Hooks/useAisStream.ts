import { Ship } from '../Components/ShipMarker';
import { useDataSource } from './useDataSource';
import { useEffect, useRef } from 'react';

type ShipListener = (ships: Ship[]) => void;

interface ShipStoreInterface {
  ships: Record<string, Ship>;
  listeners: ShipListener[];
  ws: WebSocket | null;
  lastConnectionAttempt: number;
  currentDataSource: string;
  activeConnections: number;
  
  addShip(ship: Ship): void;
  updateShip(mmsi: string, data: Partial<Ship>): void;
  getShips(): Ship[];
  subscribe(callback: ShipListener): () => void;
  notifyListeners(): void;
  connect(dataSource: string): void;
  disconnect(): void;
  setDataSource(source: string): void;
  registerConnection(): number;
  unregisterConnection(id: number): void;
}

const shipStore: ShipStoreInterface = {
  ships: {},
  listeners: [],
  ws: null,
  lastConnectionAttempt: 0,
  currentDataSource: 'antenna',
  activeConnections: 0,

  addShip(ship: Ship) {
    if (!ship || !ship.mmsi || !ship.latitude || !ship.longitude) {
      console.warn("Invalid ship data:", ship);
      return;
    }
    
    this.ships[ship.mmsi] = {
      ...ship,
      dateTimeUtc: new Date(),
      dataSource: ship.dataSource || 'antenna' 
    };
    
    this.notifyListeners();
  },
  
  updateShip(mmsi: string, data: Partial<Ship>) {
    if (!this.ships[mmsi] || !data) return;
    
    this.ships[mmsi] = {
      ...this.ships[mmsi],
      ...data,
      dateTimeUtc: new Date(),
      dataSource: data.dataSource || this.ships[mmsi].dataSource
    };
    
    this.notifyListeners();
  },
  
  getShips() {
    return Object.values(this.ships);
  },
  
  subscribe(callback: ShipListener) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },
  
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getShips()));
  },
  
  setDataSource(source: string) {
    if (this.currentDataSource !== source) {
      this.currentDataSource = source;
      this.ships = {}; 
      this.notifyListeners();
      
      // Only reconnect if we have active connections
      if (this.activeConnections > 0) {
        this.disconnect();
        this.connect(source);
      }
    }
  },

  // Register a new connection and return its ID
  registerConnection() {
    this.activeConnections++;
    console.log(`Registered connection. Active connections: ${this.activeConnections}`);
    
    // If this is the first connection, establish the WebSocket
    if (this.activeConnections === 1) {
      this.connect(this.currentDataSource);
    }
    
    return this.activeConnections;
  },
  
  // Unregister a connection
  unregisterConnection(id: number) {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    console.log(`Unregistered connection ${id}. Active connections: ${this.activeConnections}`);
    
    // If no more active connections, disconnect the WebSocket
    if (this.activeConnections === 0) {
      this.disconnect();
    }
  },

  connect(dataSource: string = 'antenna') {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.log("WebSocket connection already exists, reusing it");
      return;
    }
    
    console.log(`Starting WebSocket connection attempt for ${dataSource}`);
    
    try {
      if (this.ws) {
        this.ws.close();
      }
    } catch (e) {
      console.error("Error closing WebSocket:", e);
    }
    
    console.log(`Connecting to WebSocket server for ${dataSource} data...`);
    this.ws = new WebSocket(`ws://localhost:8766?client_name=map_client&data_source=${dataSource}`);
    
    this.ws.onopen = () => {
      console.log("WebSocket connection established for AIS data");
    };
    
    this.ws.onmessage = (event) => {
      console.log("Received WebSocket message:", event.data.substring(0, 100) + "...");
      try {
        const data = JSON.parse(event.data);
        console.log("Parsed WebSocket data:", data);
        
        if (data && data.mmsi && data.latitude !== undefined && data.longitude !== undefined) {
          const sourceFromData = data.data_source || 'antenna';
          
          if (this.ships[data.mmsi]) {
            console.log(`Updating existing ship ${data.mmsi} at [${data.latitude}, ${data.longitude}]`);
            this.updateShip(data.mmsi, {
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude),
              course: parseFloat(String(data.course || '0')),
              trueHeading: String(data.heading || '0'),
              speed: String(data.speed || '0'),
              dateTimeUtc: new Date(),
              dataSource: sourceFromData 
            });
          } else {
            const shipData = {
              mmsi: String(data.mmsi),
              shipName: data.name || data.shipName || `Vessel ${String(data.mmsi).substring(0,6)}`,
              shipType: data.ship_type?.toString() || data.shipType?.toString() || '0',
              aisClass: data.message_type === 18 ? 'B' : 'A',
              callsign: data.callsign || '',
              speed: String(data.speed || '0'),
              destination: data.destination || 'Unknown',
              trueHeading: String(data.heading || data.trueHeading || '0'),
              length: data.length || '0',
              breadth: data.breadth || '0',
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude),
              dateTimeUtc: new Date(),
              course: parseFloat(String(data.course || '0')) || 0,
              path: [],
              dataSource: sourceFromData 
            };
            
            this.addShip(shipData);
          }
        
        } else {
          console.warn("Received data missing required fields:", data);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error, "Raw data:", event.data);
      }
    };
    
    this.ws.onclose = (event) => {
      console.log(`WebSocket connection closed with code: ${event.code}, reason: ${event.reason}, wasClean: ${event.wasClean}`);
      
      // Only attempt to reconnect if we still have active connections
      if (this.activeConnections > 0) {
        setTimeout(() => this.connect(this.currentDataSource), 2000);
      } else {
        console.log("Not attempting to reconnect as there are no active connections");
      }
    };
    
    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  },
  
  disconnect() {
    if (this.ws) {
      console.log("Disconnecting WebSocket (active connections: " + this.activeConnections + ")");
      try {
        this.ws.close();
      } catch (e) {
        console.error("Error closing WebSocket:", e);
      }
      this.ws = null;
    }
  }
};

export function useAisStreamWithSource(isMonitoring = false) {
  const { dataSource } = useDataSource();
  const connectionIdRef = useRef<number | null>(null);
  
  // Handle data source changes
  useEffect(() => {
    if (isMonitoring) {
      shipStore.setDataSource(dataSource);
    }
  }, [dataSource, isMonitoring]);
  
  // Handle WebSocket connection lifecycle
  useEffect(() => {
    console.log(`useAisStreamWithSource effect triggered, isMonitoring: ${isMonitoring}`);
    
    if (isMonitoring) {
      // Register this component as using the connection
      connectionIdRef.current = shipStore.registerConnection();
      
      return () => {
        // Unregister when component unmounts or isMonitoring becomes false
        if (connectionIdRef.current !== null) {
          shipStore.unregisterConnection(connectionIdRef.current);
          connectionIdRef.current = null;
        }
      };
    }
  }, [isMonitoring]);
  
  return shipStore;
}

export default shipStore;
