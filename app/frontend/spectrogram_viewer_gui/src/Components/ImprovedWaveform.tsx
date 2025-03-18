import {
  lightningChart,
  ChartXY,
  PointLineAreaSeries,
  Themes,
  AxisScrollStrategies,
  AxisTickStrategies,
} from '@lightningchart/lcjs';
import { useEffect, useRef } from 'react';
import { useAudioStream } from '../Hooks/useAudioStream';
import { convert16BitPcmToFloat32Arrays } from '../utils/convert16BitPcmToFloat32Arrays';
import lightningchartLicense from '../lightningchartLicense.json';
import recordingConfig from '../../../../configs/recording_parameters.json';
import { Button } from '@heroui/button';

const waveformHistoryLength = 25;
const websocketUrl = 'ws://localhost:8766?client_name=waveform_client';

interface ImprovedWaveformSelectionProps {
  numChannels: number;
}

const sampleRate = recordingConfig['sampleRate'];
const viewMs = 1000 * 60 * 20;

const ImprovedWaveform = ({ numChannels }: ImprovedWaveformSelectionProps) => {
  const waveformHistoryRef = useRef<ChartXY | null>(null);
  const waveformRef = useRef<PointLineAreaSeries | null>(null);
  const chartIds = Array.from(
    { length: numChannels },
    (_, i) => `channel-${i + 1}`
  );
  const { audioData, isConnected, error, connect, disconnect } = useAudioStream(
    websocketUrl,
    false
  );

  const pointLineSeriesRef = useRef<(PointLineAreaSeries | null)[]>([]);

  useEffect(() => {
    //if (!isConnected) return;

    // Get a list of the charts based on number of channels
    const charts = chartIds.map((id) => {
      const container = document.getElementById(id) as HTMLDivElement;
      if (!container) return null;

      const chart = lightningChart({
        license: lightningchartLicense['license'],
        licenseInformation: {
          appTitle: 'LightningChart JS Trial',
          company: 'LightningChart Ltd.',
        },
      })
        .ChartXY({
          defaultAxisX: { type: 'linear-highPrecision' },
          theme: Themes.darkGold,
          container,
        })
        .setTitle(id);

      chart.axisY
        .setTitle('Amplitude')
        .setUnits('dB')
        .setInterval({ start: -1, end: -1 });

      chart.axisX
        .setScrollStrategy(AxisScrollStrategies.progressive)
        .setDefaultInterval((state) => ({
          end: state.dataMax,
          start: (state.dataMax ?? 0) - viewMs,
          stopAxisAfter: false,
        }))
        .setTickStrategy(AxisTickStrategies.DateTime);

      const pointLineAreaSeries = chart.addPointLineAreaSeries({
        dataPattern: 'ProgressiveX',
        dataStorage: Float32Array,
        allowInputModification: false,
      });

      return pointLineAreaSeries;
    });

    pointLineSeriesRef.current = charts;
    return () => {
      charts.forEach((chart) => chart?.dispose());
      pointLineSeriesRef.current.forEach((chart) => chart?.dispose());
    };
  }, [audioData, chartIds, isConnected, numChannels]);

  useEffect(() => {
    if (!audioData || !isConnected || !pointLineSeriesRef.current) return;

    console.log('Recvd audio data size: ', audioData.byteLength);
    const extractedChannels: Float32Array[] = convert16BitPcmToFloat32Arrays(
      audioData,
      numChannels
    );

    for (let i = 0; i < extractedChannels.length; i++) {
      pointLineSeriesRef.current[i]?.appendSamples({
        yValues: extractedChannels[i],
        step: 1000 / sampleRate,
      });
    }
  }, [audioData, isConnected, numChannels]);

  return (
    <>
      <Button onPress={connect}>CONNECT TO AUDIO</Button>
      <Button onPress={disconnect}>DISCONNECT FROM AUDIO</Button>
      <div className="flex flex-col gap-2.5">
        {chartIds.map((id) => (
          <div
            key={id}
            id={id}
            className="w-full h-75"
            style={{ width: '100%', height: '100%' }}
          ></div>
        ))}
      </div>
    </>
  );
};

export default ImprovedWaveform;
