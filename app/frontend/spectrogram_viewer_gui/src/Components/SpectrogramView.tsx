import { useEffect, useRef, useCallback } from 'react';
import { useSpectrogramStream } from '../Hooks/useSpectrogramStream';
import {
  NumericAxis,
  SciChartJsNavyTheme,
  SciChartSurface,
  UniformHeatmapDataSeries,
  UniformHeatmapRenderableSeries,
  HeatmapColorMap,
  EAutoRange,
  TWebAssemblyChart,
} from 'scichart';
import { SciChartReact } from 'scichart-react';

const MAX_HISTORY = 100;
const UPDATE_FREQUEN_MS = 100;

interface SpectrogramDataType {
  frequencies: number[];
  times: number[];
  spectrogramDb: number[][];
}

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';

const SpectrogramView = () => {
  // Use the custom hook to handle WebSocket connection and data
  const { spectrogramData, isConnected, error, connect, disconnect } =
    useSpectrogramStream(websocketUrl, false); // Set initial connection to false

  const sciChartRef = useRef<TWebAssemblyChart | null>(null);
  const heatmapSeriesRef = useRef<UniformHeatmapRenderableSeries | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<SpectrogramDataType | null>(null);

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const initSciChart = async () => {
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(
      'scichart-root',
      {
        theme: new SciChartJsNavyTheme(),
        title: 'Spectrogram',
        titleStyle: { fontSize: 22 },
      }
    );

    sciChartSurface.xAxes.add(
      new NumericAxis(wasmContext, {
        axisTitle: 'Time',
        autoRange: EAutoRange.Always,
      })
    );
    sciChartSurface.yAxes.add(
      new NumericAxis(wasmContext, {
        axisTitle: 'Frequency',
        autoRange: EAutoRange.Always,
      })
    );

    const initialWidth = MAX_HISTORY;
    const initialHeight = 1;

    const zValues = Array(initialHeight)
      .fill(0)
      .map(() => Array(initialWidth).fill(0));

    const heatMapDataSeries = new UniformHeatmapDataSeries(wasmContext, {
      zValues,
      xStart: 0,
      xStep: 1,
      yStart: 0,
      yStep: 1,
    });

    const heatmapSeries = new UniformHeatmapRenderableSeries(wasmContext, {
      dataSeries: heatMapDataSeries,
      colorMap: new HeatmapColorMap({
        minimum: -80,
        maximum: 0,
        gradientStops: [
          { offset: 1, color: '#EC0F6C' },
          { offset: 0.9, color: '#F48420' },
          { offset: 0.7, color: '#DC7969' },
          { offset: 0.5, color: '#67BDAF' },
          { offset: 0.3, color: '#50C7E0' },
          { offset: 0.2, color: '#264B93' },
          { offset: 0, color: '#14233C' },
        ],
      }),
    });

    sciChartSurface.renderableSeries.add(heatmapSeries);

    heatmapSeriesRef.current = heatmapSeries;
    sciChartRef.current = { sciChartSurface, wasmContext };

    return { sciChartSurface };
  };

  const updateSpectrogram = useCallback(() => {
    if (!heatmapSeriesRef.current || !sciChartRef.current) return;

    const { sciChartSurface, wasmContext } = sciChartRef.current;

    const { frequencies, times, spectrogramDb }: SpectrogramDataType =
      spectrogramData;

    if (!frequencies.length || !times.length || !spectrogramDb.length) return;

    lastDataRef.current = spectrogramData;

    const frequencyCount = frequencies.length;
    const timeSteps = Math.min(spectrogramDb[0]?.length || 0, MAX_HISTORY);

    if (timeSteps === 0) return;

    const zValues = Array(frequencyCount)
      .fill(0)
      .map((_, freqIndex) => {
        const freqData = [];
        const spectrumAtFreq = spectrogramDb[freqIndex] || [];

        for (let i = 0; i < timeSteps; i++) {
          freqData.push(spectrumAtFreq[i] || 0);
        }

        return freqData;
      });

    const newDataSeries = new UniformHeatmapDataSeries(wasmContext, {
      zValues,
      xStart: 0,
      xStep: 1,
      yStart: 0,
      yStep: frequencies.length > 1 ? frequencies[1] - frequencies[0] : 1,
    });

    heatmapSeriesRef.current.dataSeries = newDataSeries;

    sciChartSurface.invalidateElement();
  }, [spectrogramData]);

  useEffect(() => {
    if (!spectrogramData.frequencies.length) return;

    if (lastDataRef.current === spectrogramData) return;

    if (!updateTimerRef.current) {
      updateTimerRef.current = setTimeout(() => {
        updateSpectrogram();
        updateTimerRef.current = null;
      }, UPDATE_FREQUEN_MS);
    }

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, [spectrogramData, updateSpectrogram]);

  return (
    <div className="spectrogram-container">
      <div className="controls">
        <button onClick={handleConnect} disabled={isConnected}>
          Connect
        </button>
        <button onClick={handleDisconnect} disabled={!isConnected}>
          Disconnect
        </button>
        <span
          className={`status ${isConnected ? 'connected' : 'disconnected'}`}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {error && <div className="error">{error}</div>}
      </div>
      <div id="scichart-root" style={{ width: '100%', height: '500px' }}>
        <SciChartReact
          initChart={initSciChart}
          onInit={(initResult) =>
            console.log(initResult.sciChartSurface.id + ' was created')
          }
          onDelete={(initResult) =>
            console.log(initResult.sciChartSurface.id + ' was deleted')
          }
          style={{ width: '100%', height: '100%', maxWidth: '900px' }}
        />
      </div>
    </div>
  );
};

export default SpectrogramView;
