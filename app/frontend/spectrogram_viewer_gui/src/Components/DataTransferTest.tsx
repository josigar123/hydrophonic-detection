import ParameterField from './ParameterField';
import { useState, useEffect } from 'react';
import {
  useSpectrogramStream,
  SpectrogramParameters,
  messageToSend,
} from '../Hooks/useSpectrogramStream';
import { Button } from '@heroui/button';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';

const dummyData: SpectrogramParameters = {
  tperseg: 2,
  frequencyFilter: 11,
  horizontalFilterLength: 30,
  window: 'hamming',
};

interface SpectrogramDataType {
  frequencies: number[];
  times: number[];
  spectrogramDb: number[][];
}

const msg: messageToSend = {
  spectrogramConfig: dummyData,
};

const DataTransferTest = () => {
  const [spectrogramParameters, setSPectrogramParameters] =
    useState<SpectrogramParameters | null>(null);

  const { spectrogramData, isConnected, error, connect, disconnect } =
    useSpectrogramStream(websocketUrl, false);

  useEffect(() => {
    const { frequencies, times, spectrogramDb }: SpectrogramDataType =
      spectrogramData;
    console.log('Recieved spectrogram data:');
    console.log('Intensities: ', spectrogramDb);
  }, [spectrogramData]);
  return (
    <>
      <Button onPress={() => connect(msg)}>Connect</Button>
    </>
  );
};

export default DataTransferTest;
