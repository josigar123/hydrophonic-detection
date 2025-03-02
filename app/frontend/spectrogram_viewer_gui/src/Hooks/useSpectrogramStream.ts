import { useEffect, useState, useRef } from 'react';

export function useSpectrogramStream(url: string) {
  const [spectrogramData, setSpectrogramData] = useState({
    frequencies: [],
    times: [],
    spectrogramDb: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (socketRef.current) return;

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      try {
        console.log('Connected to websocket:', url);
        setIsConnected(true);
      } catch (error) {
        console.log('Error connecting to websocket:', error);
        setError('Failed to connect to websocket');
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSpectrogramData({
          frequencies: data.frequencies || [],
          times: data.times || [],
          spectrogramDb: data.spectrogramDb || [],
        });
      } catch (error) {
        console.log('Error processing  spectrogram data:', error);
        setError('Failed to process spectrogram data');
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from:', url);
      setIsConnected(false);
      setSpectrogramData({
        frequencies: [],
        times: [],
        spectrogramDb: [],
      });
      socketRef.current = null;
    };

    return () => {
      if (socketRef.current) {
        console.log('Closing WebSocket...');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [url]);

  return { spectrogramData, isConnected, error };
}
