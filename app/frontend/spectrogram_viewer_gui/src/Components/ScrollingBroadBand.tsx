import {
  AxisScrollStrategies,
  AxisTickStrategies,
  ChartXY,
  emptyFill,
  emptyLine,
  lightningChart,
  PointLineAreaSeries,
  Themes,
} from '@lightningchart/lcjs';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import lightningchartLicense from '../lightningchartLicense.json';
import { BroadbandPayload } from '../Interfaces/Payloads';

interface BroadbandProps {
  broadbandData: BroadbandPayload;
  windowInMin: number; // This field will automatically be set dependin on the bufferLength set by user
}

const ScrollingBroadBand = ({ broadbandData, windowInMin }: BroadbandProps) => {
  const chartRef = useRef<ChartXY | null>(null);
  const lineSeriesRef = useRef<PointLineAreaSeries | null>(null);

  const tFirstSampleRef = useRef<number | null>(null);
  const id = useId();

  const [containterReady, setContainerReady] = useState(false);
  const dataCountRef = useRef(0);

  const createChart = useCallback(() => {
    const container = document.getElementById(id) as HTMLDivElement;
    if (!container) return;

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
      .setTitle('Broadband');

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
      .setTitle('Amplitude')
      .setUnits('dB')
      .setInterval({ start: 0, end: 20 });

    const pointLineSeries = chart
      .addPointLineAreaSeries({
        dataPattern: 'ProgressiveX',
      })
      .setAreaFillStyle(emptyFill)
      .setStrokeStyle(emptyLine);

    return { chart, pointLineSeries };
  }, [id, windowInMin]);

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

  useEffect(() => {
    if (!containterReady) return;

    const chartInstance = createChart();
    if (!chartInstance) return;

    const { chart, pointLineSeries } = chartInstance;
    chartRef.current = chart;
    lineSeriesRef.current = pointLineSeries;

    return () => {
      pointLineSeries?.dispose();
      chart?.dispose();
      chartRef.current = null;
      lineSeriesRef.current = null;
    };
  }, [containterReady, createChart]);

  useEffect(() => {
    if (!broadbandData || !lineSeriesRef.current) return;

    const currentTimeStamp = Date.now();

    if (tFirstSampleRef.current === null) {
      tFirstSampleRef.current = currentTimeStamp;
    }

    dataCountRef.current += 1;

    broadbandData.broadbandSignal.forEach((sample) => {
      lineSeriesRef.current?.appendSample({ y: sample, x: Date.now() });
    });
  }, [broadbandData]);

  return (
    <>
      <div
        id={id}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      ></div>
    </>
  );
};

export default ScrollingBroadBand;
