import { useEffect } from 'react';
import { useSpectrogramStream } from '../Hooks/useSpectrogramStream';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';

const SpectrogramView = () => {
  const { spectrogramData, isConnected, error } =
    useSpectrogramStream(websocketUrl);

  useEffect(() => {
    if (!isConnected) return;

    console.log('Spectrogram data: ');
    console.log('Frequencies: ' + spectrogramData.frequencies);
    console.log('Times: ' + spectrogramData.times);
    console.log('Spectrogram Db: ' + spectrogramData.spectrogramDb);
  }, [spectrogramData, isConnected]);
  return <></>;
};

export default SpectrogramView;
