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

interface SpectrogramConfigView {
  tperseg?: number;
  frequencyFilter?: number;
  horizontalFilterLength?: number;
  window?: string;
  narrowbandThreshold?: number;
}

interface DemonSpectrogramConfigView {
  demonSampleFrequency?: number;
  tperseg?: number;
  frequencyFilter?: number;
  horizontalFilterLength?: number;
  window?: string;
}

interface ConfigurationView {
  spectrogramConfiguration?: SpectrogramConfigView;
  demonSpectrogramConfiguration?: DemonSpectrogramConfigView;
}

const createConfigView = (
  configuration: SpectrogramNarrowbandAndDemonConfiguration
): ConfigurationView => {
  const spec = configuration.spectrogramConfiguration;
  const demon = configuration.demonSpectrogramConfiguration;

  const specConf: SpectrogramConfigView | undefined = spec
    ? {
        tperseg: spec.tperseg,
        frequencyFilter: spec.frequencyFilter,
        horizontalFilterLength: spec.horizontalFilterLength,
        window: spec.window,
        narrowbandThreshold: spec.narrowbandThreshold,
      }
    : undefined;

  const demonConf: DemonSpectrogramConfigView | undefined = demon
    ? {
        demonSampleFrequency: demon.demonSampleFrequency,
        tperseg: demon.tperseg,
        frequencyFilter: demon.frequencyFilter,
        horizontalFilterLength: demon.horizontalFilterLength,
        window: demon.window,
      }
    : undefined;

  return {
    spectrogramConfiguration: specConf,
    demonSpectrogramConfiguration: demonConf,
  };
};

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

  const [isNarrowbandDetection, setIsNarrowbandDetection] = useState(false);

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

      setError(null);

      try {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log('Connected to websocket:', url);
          setIsConnected(true);
          setError(null);

          if (configuration) {
            // Create view
            const configView = createConfigView(configuration);

            const messageString = JSON.stringify(configView);
            socket.send(messageString);
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if ('detectionStatus' in data) {
              setIsNarrowbandDetection(data.detectionStatus);
            }

            if (data.spectrogramDb) {
              setSpectrogramData({
                frequencies: data.frequencies || [],
                times: data.times || [],
                spectrogramDb: data.spectrogramDb || [],
              });
            }

            if (data.demonSpectrogramDb) {
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
    isNarrowbandDetection,
    isConnected,
    error,
    connect,
    disconnect,
  };
}
