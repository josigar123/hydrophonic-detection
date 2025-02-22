import { useEffect, useState } from 'react';

export function useAudioStream(url: string) {
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';

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
        const data = event.data.arraybuffer();
        setAudioData(data);
      } catch (error) {
        console.log('Error processing audio:', error);
        setError('Failed to process audio data');
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from:', url);
      setIsConnected(false);
      setAudioData(null);
    };

    return () => socket.close();
  }, [url]);

  return { audioData, isConnected, error };
}
