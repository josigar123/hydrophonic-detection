import { useEffect, useState } from 'react';

export function useAudioStream(url: string) {
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      console.log('Connected to websocket:', url);
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = new Uint8Array(event.data);
      setAudioData(data);
    };

    socket.onclose = () => {
      console.log('Disconnected from:', url);
      setIsConnected(false);
    };

    return () => socket.close();
  }, [url]);

  return { audioData, isConnected };
}
