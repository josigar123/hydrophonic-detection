import { Ship } from '../Components/ShipMarker';

type ShipListener = (ships: Ship[]) => void;


interface ShipStoreInterface {
  ships: Record<string, Ship>;
  listeners: ShipListener[];
  ws: WebSocket | null;
  lastConnectionAttempt: number;
  
  addShip(ship: Ship): void;
  updateShip(mmsi: string, data: Partial<Ship>): void;
  getShips(): Ship[];
  subscribe(callback: ShipListener): () => void;
  notifyListeners(): void;
  connect(): void;
  disconnect(): void;
}


const shipStore: ShipStoreInterface = {

  ships: {},
  

  listeners: [],
  

  ws: null,
  
  
  lastConnectionAttempt: 0,
  

  addShip(ship: Ship) {

    if (!ship || !ship.mmsi || !ship.latitude || !ship.longitude) {
      console.warn("Invalid ship data:", ship);
      return;
    }
    

    this.ships[ship.mmsi] = {
      ...ship,
      dateTimeUtc: new Date()
    };
    
    this.notifyListeners();
  },
  
  updateShip(mmsi: string, data: Partial<Ship>) {
    if (!this.ships[mmsi] || !data) return;
    
    this.ships[mmsi] = {
      ...this.ships[mmsi],
      ...data,
      dateTimeUtc: new Date()
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
  

  connect() {

    const now = Date.now();
    if (now - this.lastConnectionAttempt < 2000) return;
    this.lastConnectionAttempt = now;
    

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        console.error("Error closing WebSocket:", e);
      }
    }
    
    console.log("Connecting to WebSocket server...");
    this.ws = new WebSocket('ws://localhost:8766?client_name=map_client');
    
    this.ws.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
    
        if (data && data.mmsi && data.latitude !== undefined && data.longitude !== undefined) {
          if (this.ships[data.mmsi]) {
            this.updateShip(data.mmsi, {
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude),
              course: parseFloat(String(data.course || '0')),
              trueHeading: String(data.heading || '0'),
              speed: String(data.speed || '0'),
              dateTimeUtc: new Date()
            });
          } else {
            const shipData: Ship = {
              mmsi: String(data.mmsi),
              shipName: data.name || `Vessel ${String(data.mmsi).substring(0,6)}`,
              shipType: data.ship_type?.toString() || '0',
              aisClass: data.message_type === 18 ? 'B' : 'A',
              callsign: data.callsign || '',
              speed: String(data.speed || '0'),
              destination: data.destination || 'Unknown',
              trueHeading: String(data.heading || '0'),
              length: '0',
              breadth: '0',
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude),
              dateTimeUtc: new Date(),
              course: parseFloat(String(data.course || '0')) || 0,
              path: []
            };
            
            this.addShip(shipData);
            console.log(`Added ship ${data.mmsi} at [${data.latitude}, ${data.longitude}]`);
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    this.ws.onclose = () => {
      console.log("WebSocket connection closed");
      
      setTimeout(() => this.connect(), 2000);
    };
    
    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  },
  
  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        console.error("Error closing WebSocket:", e);
      }
      this.ws = null;
    }
  }
};

setTimeout(() => {
  shipStore.connect();
}, 1000);

export default shipStore;