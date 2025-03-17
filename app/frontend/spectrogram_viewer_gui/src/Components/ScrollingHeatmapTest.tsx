import { useEffect, useId, useRef, useCallback } from 'react';
import {
  DemonSpectrogramParameters,
  InitialDemonAndSpectrogramConfigurations,
  NarrowbandDetectionThresholdParameterDb,
  SpectrogramParameters,
  useSpectrogramStream,
} from '../Hooks/useSpectrogramStream';
import {
  AxisScrollStrategies,
  ChartXY,
  ColorCSS,
  emptyLine,
  HeatmapScrollingGridSeriesIntensityValues,
  LegendBoxBuilders,
  lightningChart,
  LUT,
  PalettedFill,
  Themes,
} from '@arction/lcjs';
import { Button } from '@heroui/button';
import recordingConfig from '../../../../configs/recording_parameters.json';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';

const sampleRate = recordingConfig['sampleRate'];

const dummyData: SpectrogramParameters = {
  tperseg: 2,
  frequencyFilter: 11,
  horizontalFilterLength: 5,
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

// Represents the number of frequency bins (values to fill along the y-axis)
const resolution = 1 + (sampleRate * dummyData.tperseg) / 2;

/*heatmapMinTimeStepMs is the minimum time step to be displayed*/
// Smaller values mean more RAM ang GPU usage
const heatmapMinTimeStepMs = 500; //(0.5 * 1000) / sampleRate;

const ScrollingHeatmapTest = () => {
  const chartRef = useRef<ChartXY | null>(null);
  const heatmapSeriesRef =
    useRef<HeatmapScrollingGridSeriesIntensityValues | null>(null);
  const tFirstSampleRef = useRef<number | null>(null);
  const id = useId();
  const { spectrogramData, isConnected, connect, disconnect } =
    useSpectrogramStream(websocketUrl, false);

  const prevTimeStampRef = useRef<number | null>(null);

  useEffect(() => {
    const container = document.getElementById(id) as HTMLDivElement;
    if (!container) return;

    const lc = lightningChart({
      license: 'KEY',
      licenseInformation: {
        appTitle: 'LightningChart JS Trial',
        company: 'LightningChart Ltd.',
      },
    });

    const chart = lc.ChartXY({
      defaultAxisX: { type: 'linear' },
      theme: Themes.darkGold,
      container,
    });

    chart.setTitle('Spectrogram');

    const viewMs = 1000 * 10; // This defines the time windown that will be shown at all along x-axis
    chart.axisX
      .setScrollStrategy(AxisScrollStrategies.progressive)
      .setDefaultInterval((state) => ({
        end: state.dataMax,
        start: (state.dataMax ?? 0) - viewMs,
        stopAxisAfter: false,
      }));

    chart.axisY
      .setTitle('Frequency [Hz]')
      .setInterval({ start: 0, end: resolution });

    // LUT for mimicking matplotlib's 'inferno' colour map
    const lut = new LUT({
      percentageValues: true, // Use percentage for value/color mapping
      interpolate: true, // Smooth interpolation between colors
      units: 'dB',
      steps: [
        { value: 0.0, color: ColorCSS('#000004') }, // Dark purple (low intensity)
        { value: 0.1, color: ColorCSS('#1d114f') }, // Darker blue
        { value: 0.2, color: ColorCSS('#6a2075') }, // Purple
        { value: 0.3, color: ColorCSS('#9e3d6f') }, // Pinkish purple
        { value: 0.4, color: ColorCSS('#d85e37') }, // Orange-red
        { value: 0.5, color: ColorCSS('#f9a62a') }, // Yellow-orange
        { value: 0.6, color: ColorCSS('#fdcc2b') }, // Light yellow
        { value: 0.7, color: ColorCSS('#f8d62c') }, // Bright yellow
        { value: 0.8, color: ColorCSS('#f1e16d') }, // Pale yellow
        { value: 0.9, color: ColorCSS('#f6f5d2') }, // Very light yellow
        { value: 1.0, color: ColorCSS('#fcfdbf') }, // Almost white (high intensity)
      ],
    });

    const palettedFill = new PalettedFill({ lut, lookUpProperty: 'value' });

    const heatmapSeries = chart
      .addHeatmapScrollingGridSeries({
        scrollDimension: 'columns',
        resolution: resolution,
      })
      .setStep({ x: heatmapMinTimeStepMs, y: 1 })
      .setFillStyle(palettedFill)
      .setWireframeStyle(emptyLine)
      .setDataCleaning({
        minDataPointCount: 100,
      });

    chart
      .addLegendBox(LegendBoxBuilders.HorizontalLegendBox)
      .setAutoDispose({
        type: 'max-width',
        maxWidth: 0.8,
      })
      .add(chart);

    heatmapSeriesRef.current = heatmapSeries;
    chartRef.current = chart;

    return () => {
      heatmapSeriesRef.current?.dispose();
      chartRef.current?.dispose();
      lc.dispose();
      heatmapSeriesRef.current = null;
      chartRef.current = null;
    };
  }, [id]);

  const handleIncomingData = useCallback(
    (timestamp: number, sample: number[]) => {
      if (tFirstSampleRef.current === null) {
        tFirstSampleRef.current = timestamp;
        heatmapSeriesRef.current?.setStart({ x: timestamp, y: 0 });
      }

      const iSample = Math.round(
        (timestamp - tFirstSampleRef.current) / heatmapMinTimeStepMs
      );

      heatmapSeriesRef.current?.invalidateIntensityValues({
        iSample,
        values: [sample],
      });
    },
    []
  );

  useEffect(() => {
    if (
      !spectrogramData ||
      !isConnected ||
      !heatmapSeriesRef.current ||
      !chartRef.current
    )
      return;

    if (!prevTimeStampRef.current) {
      prevTimeStampRef.current = Date.now();
    }

    const currentTimeStamp = Date.now();
    const timestampDifference = currentTimeStamp - prevTimeStampRef.current;
    const timeStampInSeconds = timestampDifference / 1000;
    const sample = spectrogramData.spectrogramDb;

    prevTimeStampRef.current = currentTimeStamp;

    handleIncomingData(timeStampInSeconds, sample);
  }, [handleIncomingData, isConnected, spectrogramData]);

  return (
    <>
      <Button onPress={() => connect(cnfg)}>CONNECT</Button>
      <Button onPress={disconnect}>DISCONNECT</Button>
      <div id={id} style={{ width: '100%', height: '100%' }}></div>
    </>
  );
};

export default ScrollingHeatmapTest;
