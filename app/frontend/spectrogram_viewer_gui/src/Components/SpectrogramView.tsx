import { useEffect } from 'react';
import { useSpectrogramStream } from '../Hooks/useSpectrogramStream';
import { Button } from '@heroui/button';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';

const SpectrogramView = () => {
  const { spectrogramData, isConnected, error, connect, disconnect } =
    useSpectrogramStream(websocketUrl, false); // Set autoConnect to false

  useEffect(() => {
    if (isConnected) {
      console.log('Connected to spectrogram websocket');
      console.log('Frequencies length:', spectrogramData.frequencies.length);
      console.log('Times length:', spectrogramData.times.length);
      console.log(
        'Spectrogram data size:',
        spectrogramData.spectrogramDb.length
      );
    }
  }, [spectrogramData, isConnected]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <p>Connection status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        {error && <p className="text-red-500">Error: {error}</p>}
      </div>

      <div className="space-x-4">
        <Button onPress={connect} disabled={isConnected}>
          Connect
        </Button>

        <Button onPress={disconnect} disabled={!isConnected}>
          Disconnect
        </Button>
      </div>

      {isConnected && spectrogramData.spectrogramDb.length > 0 && (
        <div className="mt-4">
          <p>Receiving spectrogram data...</p>
          {/* You could render your spectrogram visualization here */}
        </div>
      )}
    </div>
  );
};

export default SpectrogramView;
