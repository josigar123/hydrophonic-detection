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
import { SpectrogramPayload } from '../Interfaces/Payloads';
import recordinParameters from '../../../../configs/recording_parameters.json';
import { denormalizedInfernoData } from '../ColorMaps/colorMaps';

const sampleRate = recordinParameters['sampleRate'];
const nyQuistFrequency = sampleRate / 2;

interface SpectrogramProps {
  spectrogramData: SpectrogramPayload; // Contains all necessary spectrogram data
  windowInMin: number; // how much data the window will hold in time
  resolution: number; // Number of frequency bins
  heatmapMinTimeStepMs: number; //heatmapMinTimeStepMs is the minimum time step to be displayed
  maxFrequency: number;
  minFrequency: number;
  maxDb: number;
  minDb: number;
}

const ScrollingSpectrogram = ({
  spectrogramData,
  windowInMin,
  resolution,
  heatmapMinTimeStepMs,
  maxFrequency,
  minFrequency,
  maxDb,
  minDb,
}: SpectrogramProps) => {
  const chartRef = useRef<ChartXY | null>(null);
  const heatmapSeriesRef =
    useRef<HeatmapScrollingGridSeriesIntensityValues | null>(null);

  const tFirstSampleRef = useRef<number | null>(null);
  const id = useId();

  const [containerReady, setContainerReady] = useState(false);
  const dataCountRef = useRef(0);

  // Function for memoizing chart creation, preventing unecessary re-renders
  const createChart = useCallback(() => {
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
      .setTitle('Spectrogram');

    const viewMs = 1000 * 60 * windowInMin;

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

    const lut = new LUT({
      steps: regularColorSteps(minDb, maxDb, denormalizedInfernoData),
      units: 'dB',
      interpolate: true,
    });

    const palettedFill = new PalettedFill({
      lut,
      lookUpProperty: 'value',
    });

    const heatmapSeries = chart
      .addHeatmapScrollingGridSeries({
        scrollDimension: 'columns',
        resolution: resolution,
      })
      .setStep({
        x: heatmapMinTimeStepMs,
        y: nyQuistFrequency / (resolution - 1),
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

    return { chart, heatmapSeries };
  }, [
    id,
    windowInMin,
    minFrequency,
    maxFrequency,
    minDb,
    maxDb,
    resolution,
    heatmapMinTimeStepMs,
  ]);

  // Setting container readiness, lightningchart wont render if its container is not ready (WebGL warning)
  useEffect(() => {
    const container = document.getElementById(id);
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setContainerReady(true);
    } else {
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

  // Chart gets created if, and only if continer is ready
  useEffect(() => {
    if (!containerReady) return;

    const chartInstance = createChart();
    if (!chartInstance) return;

    const { chart, heatmapSeries } = chartInstance;
    chartRef.current = chart;
    heatmapSeriesRef.current = heatmapSeries;

    return () => {
      heatmapSeries?.dispose();
      chart?.dispose();
      chartRef.current = null;
      heatmapSeriesRef.current = null;
    };
  }, [containerReady, createChart]);

  useEffect(() => {
    if (!spectrogramData || !heatmapSeriesRef.current) return;

    const currentTimestamp = Date.now();

    if (tFirstSampleRef.current === null) {
      tFirstSampleRef.current = currentTimestamp;
      heatmapSeriesRef.current.setStart({
        x: currentTimestamp,
        y: spectrogramData.frequencies[0] || minFrequency,
      });
    }

    const sampleIndex = dataCountRef.current;
    dataCountRef.current += 1;

    heatmapSeriesRef.current.invalidateIntensityValues({
      iSample: sampleIndex,
      values: [spectrogramData.spectrogramDb],
    });
  }, [spectrogramData, minFrequency]);

  return (
    <>
      <div
        id={id}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      ></div>
    </>
  );
};

export default ScrollingSpectrogram;
