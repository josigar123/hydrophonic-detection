import { useEffect, useState, useRef, useCallback } from 'react';

export function useSpectrogramStream(url: string, autoConnect = false) {
  const [spectrogramData, setSpectrogramData] = useState({
    frequencies: [],
    times: [],
    spectrogramDb: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldConnectRef = useRef(autoConnect);

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
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Connected to websocket:', url);
        setIsConnected(true);
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          console.log('Data recieved: ', event.data);
          const data = JSON.parse(event.data);
          setSpectrogramData({
            frequencies: data.frequencies || [],
            times: data.times || [],
            spectrogramDb: data.spectrogramDb || [],
          });
        } catch (error) {
          console.error('Error processing spectrogram data:', error);
          setError('Failed to process spectrogram data');
        }
      };

      socket.onclose = (event) => {
        console.log(
          `Disconnected from ${url}. Code: ${event.code}, Reason: ${event.reason}`
        );
        setIsConnected(false);
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
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;

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
      if (socketRef.current) {
        console.log('Cleaning up WebSocket connection');
        shouldConnectRef.current = false;
        socketRef.current.close();
      }
    };
  }, [autoConnect, connect]);

  return {
    spectrogramData,
    isConnected,
    error,
    connect,
    disconnect,
  };
}
