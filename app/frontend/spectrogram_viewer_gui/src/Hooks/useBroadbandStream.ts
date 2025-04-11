import { useEffect, useState, useRef, useCallback } from 'react';
import { BroadbandPayload, BroadbandDetections } from '../Interfaces/Payloads';
import { BroadbandConfiguration } from '../Interfaces/Configuration';

export function useBroadbandStream(url: string, autoConnect = false) {
  const [broadbandData, setBroadbandData] = useState<BroadbandPayload>({
    broadbandSignal: [],
    times: [],
  });

  const [isBroadbandDetections, setIsBroadbandDetections] =
    useState<BroadbandDetections>({
      detections: {
        channel1: false,
        channel2: false,
        channel3: false,
        channel4: false,
        summarizedDetection: false,
      },
    });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldConnectRef = useRef(autoConnect);

  const connect = useCallback(
    (configuration?: BroadbandConfiguration) => {
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

          if (configuration) {
            const messageString = JSON.stringify(configuration);
            socket.send(messageString);
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if ('detections' in data) {
              setIsBroadbandDetections((prevState) => ({
                detections: {
                  ...prevState.detections,
                  ...(data.detections || {}),
                },
              }));
            }

            if ('broadbandSignal' in data) {
              setBroadbandData({
                broadbandSignal: data.broadbandSignal || [],
                times: data.times || [],
              });
            }
          } catch (error) {
            console.error(
              'Error parsing message in useBroadbandStream:',
              error
            );
            setError('Error parsing message in useBroadbandStream');
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
    },
    [url]
  );

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
    broadbandData,
    isBroadbandDetections,
    isConnected,
    error,
    connect,
    disconnect,
  };
}
