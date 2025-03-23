import { useEffect, useState, useRef, useCallback } from 'react';
import {
  SpectrogramPayload,
  DemonSpectrogramPayload,
} from '../Interfaces/Payloads';
import { SpectrogramNarrowbandAndDemonConfiguration } from '../Interfaces/Configuration';

/*

A hook for fetching all spectrogramdata, both for a standards spectrogram and a DEMON spectrogram
Supply, with the connect() function, an initial configuration, following the interface  found in 'Configurations.ts'
in the Interfaces directory

*/

export function useSpectrogramStream(url: string, autoConnect = false) {
  const [spectrogramData, setSpectrogramData] = useState<SpectrogramPayload>({
    frequencies: [],
    times: [],
    spectrogramDb: [],
  });

  const [demonSpectrogramData, setDemonSpectrogramData] =
    useState<DemonSpectrogramPayload>({
      demonFrequencies: [],
      demonTimes: [],
      demonSpectrogramDb: [],
    });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldConnectRef = useRef(autoConnect);

  const connect = useCallback(
    (configuration?: SpectrogramNarrowbandAndDemonConfiguration) => {
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      console.log('Configuration:\n', JSON.stringify(configuration, null, 2));

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

            if (data.spectrogramDb) {
              console.log('RECVD spectrogram data: ', data.spectrogramDb);
              setSpectrogramData({
                frequencies: data.frequencies || [],
                times: data.times || [],
                spectrogramDb: data.spectrogramDb || [],
              });
            }

            if (data.demonSpectrogramDb) {
              console.log('RECVD spectrogram data: ', data.demonSpectrogramDb);
              setDemonSpectrogramData({
                demonFrequencies: data.demonFrequencies || [],
                demonTimes: data.demonTimes || [],
                demonSpectrogramDb: data.demonSpectrogramDb || [],
              });
            }
          } catch (error) {
            console.error(
              'Error parsing message in useSpectrogramStream:',
              error
            );
            setError('Error parsing message in useSpectrogramStream');
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
    spectrogramData,
    demonSpectrogramData,
    isConnected,
    error,
    connect,
    disconnect,
  };
}
