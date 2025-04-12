import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserPosition } from './useUserPosition';

export function usePositionSync(
  url: string = 'ws://localhost:8766',
  radiusKm: number = 25,
  autoConnect = false
) {
  const { position } = useUserPosition();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldConnectRef = useRef(autoConnect);

  const sendPosition = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && position) {
      const message = {
        type: 'user-position',
        data: {
          latitude: position.latitude,
          longitude: position.longitude,
          radius_km: radiusKm
        }
      };
      
      try {
        socketRef.current.send(JSON.stringify(message));
        console.log('Position sent to backend:', message.data);
      } catch (error) {
        console.error('Error sending position:', error);
        setError('Error sending position data');
      }
    }
  }, [position, radiusKm]);

  const connect = useCallback(() => {
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setError(null);

    try {
      const wsUrl = `${url}?client_name=position_client`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Connected to position sync websocket:', wsUrl);
        setIsConnected(true);
        setError(null);
        
        sendPosition();
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        intervalRef.current = setInterval(sendPosition, 30000);
      };

      socket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (response.status === 'error') {
            console.error('Error from server:', response.message);
            setError(`Server error: ${response.message}`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setError('Error parsing message from server');
        }
      };

      socket.onclose = (event) => {
        console.log(
          `Disconnected from position sync server. Code: ${event.code}, Reason: ${event.reason}`
        );
        setIsConnected(false);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        socketRef.current = null;

        if (shouldConnectRef.current) {
          console.log('Attempting to reconnect in 3 seconds...');
          setTimeout(() => {
            if (shouldConnectRef.current) {
              connect();
            }
          }, 3000);
        }
      };

      socket.onerror = (event) => {
        console.error('Position sync WebSocket error:', event);
        setError('Position sync WebSocket connection error');
      };
    } catch (error) {
      console.error('Error creating position sync WebSocket:', error);
      setError('Failed to create position sync WebSocket connection');
    }
  }, [url, sendPosition]);

  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      shouldConnectRef.current = true;
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendPosition
  };
}