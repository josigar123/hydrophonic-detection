import ParameterField from './ParameterField';
import { useState, useEffect } from 'react';
import {
  useSpectrogramStream,
  SpectrogramParameters,
  InitialDemonAndSpectrogramConfigurations,
  DemonSpectrogramParameters,
  NarrowbandDetectionThresholdParameterDb,
} from '../Hooks/useSpectrogramStream';
import { Button } from '@heroui/button';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';

const dummyData: SpectrogramParameters = {
  tperseg: 2,
  frequencyFilter: 11,
  horizontalFilterLength: 15,
  window: 'hamming',
};

const demonDummyData: DemonSpectrogramParameters = {
  demonSampleFrequency: 200,
  tperseg: 2,
  frequencyFilter: 9,
  horizontalFilterLength: 20,
  window: 'hamming',
};

const narrowbandDummyData: NarrowbandDetectionThresholdParameterDb = {
  threshold: 9,
};

const cnfg: InitialDemonAndSpectrogramConfigurations = {
  config: {
    spectrogramConfig: dummyData,
    demonSpectrogramConfig: demonDummyData,
    narrowbandDetectionThresholdDb: narrowbandDummyData,
  },
};

interface SpectrogramDataType {
  frequencies: number[];
  times: number[];
  spectrogramDb: number[];
}

interface DemonSpectrogramDataType {
  demonFrequencies: number[];
  demonTimes: number[];
  demonSpectrogramDb: number[];
}

const DataTransferTest = () => {
  const [spectrogramParameters, setSPectrogramParameters] =
    useState<SpectrogramParameters | null>(null);

  const {
    spectrogramData,
    demonSpectrogramData,
    isConnected,
    error,
    connect,
    disconnect,
  } = useSpectrogramStream(websocketUrl, false);

  useEffect(() => {
    const { frequencies, times, spectrogramDb }: SpectrogramDataType =
      spectrogramData;
    console.log('Recieved spectrogram data:');
    console.log('SPECTROGRAM Intensities: ', spectrogramDb);
  }, [spectrogramData]);

  useEffect(() => {
    const {
      demonFrequencies,
      demonTimes,
      demonSpectrogramDb,
    }: DemonSpectrogramDataType = demonSpectrogramData;
    console.log('Recieved DEMON spectrogram data:');
    console.log('DEMON Intensities: ', demonSpectrogramDb);
  }, [demonSpectrogramData]);
  return (
    <>
      <Button onPress={() => connect(cnfg)}>Connect</Button>
      <Button onPress={disconnect}>Disconnect</Button>
    </>
  );
};

export default DataTransferTest;
