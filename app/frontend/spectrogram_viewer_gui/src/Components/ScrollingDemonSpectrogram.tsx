import { useEffect, useRef, useCallback, useState, useId } from 'react';
import {
  AxisScrollStrategies,
  AxisTickStrategies,
  ChartXY,
  emptyLine,
  HeatmapScrollingGridSeriesIntensityValues,
  LegendBoxBuilders,
  lightningChart,
  LUT,
  PalettedFill,
  regularColorSteps,
  Themes,
} from '@lightningchart/lcjs';
import lightningchartLicense from '../lightningchartLicense.json';
import { DemonSpectrogramPayload } from '../Interfaces/SpectrogramPayload';

interface DemonSpectrogramProps {
  demonSpectrogramData: DemonSpectrogramPayload; // Contains all necessary spectrogram data
  windowInMin: number; // how much data the window will hold in time
  resolution: number; // Number of frequency bins
  heatmapMinTimeStepMs: number; //heatmapMinTimeStepMs is the minimum time step to be displayed
  maxFrequency: number;
  minFrequency: number;
  maxDb: number;
  minDb: number;
}

const ScrollingDemonSpectrogram = ({
  demonSpectrogramData,
  windowInMin,
  resolution,
  heatmapMinTimeStepMs,
  maxFrequency,
  minFrequency,
  maxDb,
  minDb,
}: DemonSpectrogramProps) => {
  const chartRef = useRef<ChartXY | null>(null);
  const heatmapSeriesRef =
    useRef<HeatmapScrollingGridSeriesIntensityValues | null>(null);

  const tFirstSampleRef = useRef<number | null>(null);
  const id = useId();

  const [containerReady, setContainerReady] = useState(false);

  const prevTimeStampRef = useRef<number | null>(null);

  useEffect(() => {
    const container = document.getElementById(id);
    if (!container) return;

    // Check if container has dimensions
    const { width, height } = container.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setContainerReady(true);
    } else {
      // Use ResizeObserver to detect when dimensions become available
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setContainerReady(true);
            resizeObserver.disconnect();
          }
        }
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }
  }, [id]);

  useEffect(() => {
    if (!containerReady) return;

    const container = document.getElementById(id) as HTMLDivElement;
    if (!container) return;
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

    const viewMs = 1000 * 60 * windowInMin; // This defines the time windown that will be shown at all along x-axis

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
      .setInterval({ start: minFrequency, end: maxFrequency });

    const theme = chart.getTheme();
    if (!theme.examples) return;
    const lut = new LUT({
      steps: regularColorSteps(
        minDb,
        maxDb,
        Themes.darkGold.examples.intensityColorPalette
      ),
      units: 'dB',
      interpolate: true,
    });

    const palettedFill = new PalettedFill({ lut, lookUpProperty: 'value' });

    const heatmapSeries = chart
      .addHeatmapScrollingGridSeries({
        scrollDimension: 'columns',
        resolution: resolution,
      })
      .setStep({
        x: heatmapMinTimeStepMs,
        y: (maxFrequency - minFrequency) / (resolution - 1), // Assumes uniformly distributed frequency bins
      })
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
  }, [
    containerReady,
    heatmapMinTimeStepMs,
    id,
    maxDb,
    maxFrequency,
    minDb,
    minFrequency,
    resolution,
    windowInMin,
  ]);

  const handleIncomingData = useCallback(
    (timestamp: number, sample: number[], frequencies: number[]) => {
      if (tFirstSampleRef.current === null) {
        tFirstSampleRef.current = timestamp;

        const minFreq = frequencies[0] || 0;
        heatmapSeriesRef.current?.setStart({ x: timestamp, y: minFreq });
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
    if (!demonSpectrogramData || !heatmapSeriesRef.current || !chartRef.current)
      return;

    // Use timestamp in milliseconds to better match the example code
    const currentTimeStamp = Date.now();

    if (!prevTimeStampRef.current) {
      prevTimeStampRef.current = currentTimeStamp;
      return; // Skip first data point to establish time reference
    }

    const sample = demonSpectrogramData.demonSpectrogramDb;
    const frequencies = demonSpectrogramData.demonFrequencies;
    handleIncomingData(currentTimeStamp, sample, frequencies);

    prevTimeStampRef.current = currentTimeStamp;
  }, [handleIncomingData, demonSpectrogramData]);

  return (
    <>
      <div
        id={id}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      ></div>
    </>
  );
};

export default ScrollingDemonSpectrogram;
