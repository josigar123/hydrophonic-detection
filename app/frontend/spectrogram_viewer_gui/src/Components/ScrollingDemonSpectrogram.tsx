import {
  AxisScrollStrategies,
  AxisTickStrategies,
  ChartXY,
  ColorCSS,
  emptyLine,
  HeatmapScrollingGridSeriesIntensityValues,
  LegendBoxBuilders,
  lightningChart,
  LUT,
  PalettedFill,
  Themes,
} from '@lightningchart/lcjs';
import { useCallback, useEffect, useId, useRef } from 'react';
import lightningchartLicense from '../lightningchartLicense.json';

interface ScrollingDemonSpectrogamProps {
  demonData: number[];
  sampleRate: number;
  tperseg: number;
  xAxisViewInMinutes: number;
  heatmapMinTimeStepMs: number;
}

const ScrollingDemonSpectrogram = ({
  demonData,
  sampleRate,
  tperseg,
  xAxisViewInMinutes,
  heatmapMinTimeStepMs,
}: ScrollingDemonSpectrogamProps) => {
  const chartRef = useRef<ChartXY | null>(null);
  const heatmapSeriesRef =
    useRef<HeatmapScrollingGridSeriesIntensityValues | null>(null);
  const tFirstSampleRef = useRef<number | null>(null);
  const id = useId();

  const prevTimeStampRef = useRef<number | null>(null);

  useEffect(() => {
    const container = document.getElementById(id) as HTMLDivElement;
    if (!container) return;

    const viewMs = xAxisViewInMinutes * 1000 * 60;
    const resolution = 1 + (sampleRate * tperseg) / 2;
    // Creating the XY chart for plotting the heatmap
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
      .setTitle('DEMON Spectrogram');

    chart.axisX
      .setScrollStrategy(AxisScrollStrategies.progressive)
      .setDefaultInterval((state) => ({
        end: state.dataMax,
        start: (state.dataMax ?? 0) - viewMs,
        stopAxisAfter: false,
      }))
      .setTickStrategy(AxisTickStrategies.DateTime);

    chart.axisY
      .setTitle('Frequency')
      .setUnits('Hz')
      .setInterval({ start: 0, end: resolution });

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
        minDataPointCount: 1000,
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
      heatmapSeriesRef.current = null;
      chartRef.current = null;
    };
  }, [heatmapMinTimeStepMs, id, sampleRate, tperseg, xAxisViewInMinutes]);

  const handleIncomingData = useCallback(
    (timestamp: number, sample: number[]) => {
      if (tFirstSampleRef.current === null) {
        tFirstSampleRef.current = timestamp;
        heatmapSeriesRef.current?.setStart({ x: timestamp, y: 0 });
      }

      // Keep timestamp in milliseconds (don't convert to seconds)
      const iSample = Math.round(
        (timestamp - tFirstSampleRef.current) / heatmapMinTimeStepMs
      );

      heatmapSeriesRef.current?.invalidateIntensityValues({
        iSample,
        values: [sample],
      });
    },
    [heatmapMinTimeStepMs]
  );

  useEffect(() => {
    if (!demonData || !heatmapSeriesRef.current || !chartRef.current) return;

    // Use timestamp in milliseconds to better match the example code
    const currentTimeStamp = Date.now();

    if (!prevTimeStampRef.current) {
      prevTimeStampRef.current = currentTimeStamp;
      return; // Skip first data point to establish time reference
    }

    const sample = demonData;
    handleIncomingData(currentTimeStamp, sample);

    prevTimeStampRef.current = currentTimeStamp;
  }, [demonData, handleIncomingData]);

  return (
    <>
      <div id={id} style={{ width: '100%', height: '100%' }}></div>
    </>
  );
};

export default ScrollingDemonSpectrogram;
