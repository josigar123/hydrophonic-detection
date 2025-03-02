import { useEffect, useRef } from 'react';
import { useSpectrogramStream } from '../Hooks/useSpectrogramStream';
import { Button } from '@heroui/button';
import {
  ChartXY,
  ColorRGBA,
  HeatmapScrollingGridSeriesIntensityValues,
  LightningChart,
  SolidFill,
  lightningChart,
  PalettedFill,
  LUT,
  emptyLine,
  AxisScrollStrategies,
  AxisTickStrategies,
  LegendBoxBuilders,
  regularColorSteps,
  Themes,
} from '@lightningchart/lcjs';

import { createSpectrumDataGenerator } from '@lightningchart/xydata';

const dataSampleSize = 512;
const sampleRateHz = 100;
const heatmapMinTimeStepMs = (0.5 * 1000) / sampleRateHz;
const viewMs = 10 * 1000;

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';

const SpectrogramView = () => {
  const { spectrogramData, isConnected, error, connect, disconnect } =
    useSpectrogramStream(websocketUrl, false);

  const lightningChartRef = useRef<LightningChart | null>(null);
  const chartRef = useRef<ChartXY | null>(null);
  const heatmapSeriesRef =
    useRef<HeatmapScrollingGridSeriesIntensityValues | null>(null);

  useEffect(function initializeSpectrogramOnMount() {
    if (!lightningChartRef.current) {
      // Get instance from license
      lightningChartRef.current = lightningChart({
        license: 'AAAAAAAAAAAAAAAAAAAAA',
        licenseInformation: {
          appTitle: 'LightningChart JS Trial',
          company: 'LightningChart Ltd.',
        },
      });

      // Create XY chart to hold heatmap
      chartRef.current = lightningChartRef.current.ChartXY({
        defaultAxisX: { type: 'linear-highPrecision' },
        theme: Themes.darkGold,
      });
      chartRef.current
        .setTitle('Spectrogram')
        .setTitleFont((font) => font.setSize(10).setFamily('Segoe UI'))
        .setTitleFillStyle(new SolidFill({ color: ColorRGBA(255, 0, 0) }))
        .setTitlePosition('series-left-top');

      chartRef.current.axisX
        .setScrollStrategy(AxisScrollStrategies.progressive)
        .setDefaultInterval((state) => ({
          end: state.dataMax,
          start: (state.dataMax ?? 0) - viewMs,
          stopAxisAfter: false,
        }))
        .setTickStrategy(AxisTickStrategies.DateTime);

      chartRef.current.axisY
        .setTitle('Frequency')
        .setUnits('Hz')
        .setInterval({ start: 0, end: dataSampleSize });

      const theme = chartRef.current.getTheme();
      const lut = new LUT({
        steps: regularColorSteps(0, 75, theme.examples.spectrogramColorPalette),
        units: 'dB',
        interpolate: true,
      });
      const paletteFill = new PalettedFill({ lut, lookUpProperty: 'value' });

      heatmapSeriesRef.current = chartRef.current
        .addHeatmapScrollingGridSeries({
          scrollDimension: 'columns',
          resolution: dataSampleSize,
        })
        .setStep({ x: heatmapMinTimeStepMs, y: 1 })
        .setFillStyle(paletteFill)
        .setWireframeStyle(emptyLine)
        .setDataCleaning({
          minDataPointCount: 1000,
        });

      const legend = chartRef.current
        .addLegendBox(LegendBoxBuilders.HorizontalLegendBox)
        // Dispose example UI elements automatically if they take too much space. This is to avoid bad UI on mobile / etc. devices.
        .setAutoDispose({
          type: 'max-width',
          maxWidth: 0.8,
        })
        .add(chartRef.current);

      let tFirstSample: number;
      const handleIncomingData = (timestamp: number, sample: number[]) => {
        if (!tFirstSample) {
          tFirstSample = timestamp;
          heatmapSeriesRef.current?.setStart({ x: timestamp, y: 0 });
        }
        // Calculate sample index from timestamp to place sample in correct location in heatmap.
        const iSample = Math.round(
          (timestamp - tFirstSample) / heatmapMinTimeStepMs
        );
        heatmapSeriesRef.current?.invalidateIntensityValues({
          iSample,
          values: [sample],
        });
      };
    }
  }, []);

  useEffect(() => {
    if (isConnected && heatmapSeriesRef.current && spectrogramData) {
      const frequencies = spectrogramData.frequencies;
      const times = spectrogramData.times;
      const spectrogramDb = spectrogramData.spectrogramDb;

      const data: number[][] = [];

      for (let i = 0; i < times.length; i++) {
        const row: number[] = [];
        for (let j = 0; j < frequencies.length; j++) {
          const dbValue = spectrogramDb[j + i * frequencies.length];
          row.push(dbValue);
        }
        data.push(row);
      }
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
        <div className="mt-4"></div>
      )}
    </div>
  );
};

export default SpectrogramView;
