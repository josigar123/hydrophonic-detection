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
import { ScotPayload } from '../Interfaces/Payloads';
import { denormalizedMagmaData } from '../ColorMaps/colorMaps';

interface CrossCorrelationProps {
  scotData: ScotPayload;
  windowInMin: number;
  correlationLength: number;
  refreshRateInSeconds: number;
}

const ScrollingCrossCorrelation = ({
  scotData,
  windowInMin,
  correlationLength,
  refreshRateInSeconds,
}: CrossCorrelationProps) => {
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
      .setTitle('Smoothed Coherence Transform (SCOT)');

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
      .setTitle('Time delay between channels')
      .setUnits('s')
      .setInterval({
        start: scotData.graphLine[0] ?? 0,
        end: scotData.graphLine[scotData.graphLine.length - 1] ?? 10,
      });

    const lut = new LUT({
      steps: regularColorSteps(0, 0.15, denormalizedMagmaData),
      units: 'dB',
      interpolate: true,
    });

    const palettedFill = new PalettedFill({
      lut,
      lookUpProperty: 'value',
    });

    const heatmapMinTimeStepMs = refreshRateInSeconds * 1000;

    const heatmapSeries = chart
      .addHeatmapScrollingGridSeries({
        scrollDimension: 'columns',
        resolution: scotData.graphLine.length,
      })
      .setStep({
        x: heatmapMinTimeStepMs,
        y: scotData.graphLine[1] - scotData.graphLine[0],
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
  }, [id, refreshRateInSeconds, scotData.graphLine, windowInMin]);

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
    if (!scotData || !heatmapSeriesRef.current) return;

    const currentTimestamp = Date.now();

    console.log('ORIGIN: ', scotData.graphLine[0]);
    console.log('APEX: ', scotData.graphLine[scotData.graphLine.length - 1]);

    if (tFirstSampleRef.current === null) {
      tFirstSampleRef.current = currentTimestamp;
      heatmapSeriesRef.current.setStart({
        x: currentTimestamp,
        y: scotData.graphLine[0],
      });
    }

    const sampleIndex = dataCountRef.current;
    dataCountRef.current += 1;

    heatmapSeriesRef.current.invalidateIntensityValues({
      iSample: sampleIndex,
      values: scotData.crossCorrelationLagTimes,
    });
  }, [correlationLength, refreshRateInSeconds, scotData]);

  return (
    <>
      <div
        id={id}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      ></div>
    </>
  );
};

export default ScrollingCrossCorrelation;
