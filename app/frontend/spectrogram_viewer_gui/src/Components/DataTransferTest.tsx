import { useEffect } from 'react';
import { useSpectrogramStream } from '../Hooks/useSpectrogramStream';
import { Button } from '@heroui/button';
import {
  SpectrogramPayload,
  DemonSpectrogramPayload,
} from '../Interfaces/SpectrogramPayload';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';

const DataTransferTest = () => {
  const {
    spectrogramData,
    demonSpectrogramData,

    connect,
    disconnect,
  } = useSpectrogramStream(websocketUrl, false);

  useEffect(() => {
    const { frequencies, times, spectrogramDb }: SpectrogramPayload =
      spectrogramData;
    console.log('Recieved spectrogram data:');
    console.log('SPECTROGRAM Intensities: ', spectrogramDb);
  }, [spectrogramData]);

  useEffect(() => {
    const {
      demonFrequencies,
      demonTimes,
      demonSpectrogramDb,
    }: DemonSpectrogramPayload = demonSpectrogramData;
    console.log('Recieved DEMON spectrogram data:');
    console.log('DEMON Intensities: ', demonSpectrogramDb);
  }, [demonSpectrogramData]);
  return (
    <>
      <Button onPress={() => connect()}>Connect</Button>
      <Button onPress={disconnect}>Disconnect</Button>
    </>
  );
};

export default DataTransferTest;
