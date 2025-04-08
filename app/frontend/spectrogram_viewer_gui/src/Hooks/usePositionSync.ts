import { useEffect, useRef } from 'react';
import useUserPosition from '../Hooks/useUserPosition';


export function usePositionSync(
  webSocketUrl: string = 'ws://localhost:8766?client_name=position_client',
  radiusKm: number = 25
) {
  const { position } = useUserPosition();
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(webSocketUrl);
      
      ws.onopen = () => {
        console.log('Position WebSocket connected');
        sendPosition();
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(sendPosition, 30000);
      };
      
      ws.onclose = (event) => {
        console.log('Position WebSocket closed:', event);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        setTimeout(connectWebSocket, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('Position WebSocket error:', error);
      };
      
      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (response.status === 'error') {
            console.error('Error from server:', response.message);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };
      
      wsRef.current = ws;
    };

    const sendPosition = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && position) {
        const message = {
          type: 'user-position',
          data: {
            latitude: position.latitude,
            longitude: position.longitude,
            radius_km: radiusKm
          }
        };
        
        wsRef.current.send(JSON.stringify(message));
        console.log('Position sent to backend:', message.data);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [position, webSocketUrl, radiusKm]);
}