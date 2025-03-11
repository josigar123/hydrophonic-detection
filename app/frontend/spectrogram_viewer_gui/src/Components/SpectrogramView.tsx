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
  NumberRange,
  TextLabelProvider,
  ENumericFormat,
  HeatmapLegend,
  LabelProviderBase2D,
  CursorModifier,
} from 'scichart';
import { SciChartReact } from 'scichart-react';
import { Button } from '@heroui/button';

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

  // Will hold all the intensities for visualization
  const intensitiesRef = useRef<number[][]>([]);

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
        drawLabels: false,
        drawMinorTickLines: false,
        drawMajorTickLines: false,
        labelProvider: new TextLabelProvider({
          labelFormat: ENumericFormat.Engineering,
          labelPostfix: 's',
        }),
        visibleRange: new NumberRange(0, 10 * 196),
      })
    );
    sciChartSurface.yAxes.add(
      new NumericAxis(wasmContext, {
        axisTitle: 'Frequency',
        autoRange: EAutoRange.Always,
        drawLabels: false,
        drawMinorTickLines: false,
        drawMajorTickLines: false,
        labelProvider: new TextLabelProvider({
          labelFormat: ENumericFormat.Engineering,
          labelPostfix: 'Hz',
        }),
        visibleRange: new NumberRange(0, 1000), // Sets visible range only to 1000Hz
      })
    );

    const initialWidth = 196;
    const initialHeight = 129;
    console.log('INITIAL WIDTH: ', initialWidth);
    console.log('INITIAL HEIGHT: ', initialHeight);

    // Initialize all intensities to 0
    const zValues = Array(initialHeight)
      .fill(0)
      .map(() => Array(initialWidth).fill(0));

    // Creates data series to pass in final data series
    const heatMapDataSeries = new UniformHeatmapDataSeries(wasmContext, {
      zValues: zValues,
      xStart: 0,
      xStep: 1,
      yStart: 0,
      yStep: 1,
    });

    // Create the colour map
    const heatmapColorMap = new HeatmapColorMap({
      minimum: -40, // Value to adjust dynamically
      maximum: 0, // Value to adjust dynamically
      // TODO: Checkf if there exists and enum for gradientStops
      gradientStops: [
        { offset: 0, color: '#000000' },
        { offset: 0.25, color: '#800080' },
        { offset: 0.5, color: '#FF0000' },
        { offset: 0.75, color: '#FFFF00' },
        { offset: 1, color: '#FFFFFF' },
      ],
    });

    // Creates the initial data series with config
    const heatmapSeries = new UniformHeatmapRenderableSeries(wasmContext, {
      dataSeries: heatMapDataSeries,
      colorMap: heatmapColorMap,
    });

    sciChartSurface.renderableSeries.add(heatmapSeries);

    heatmapSeriesRef.current = heatmapSeries;
    sciChartSurface.chartModifiers.add(
      new CursorModifier({
        showTooltip: true,
        showAxisLabels: true,
        tooltipContainerBackground: 'rgba(0, 0, 0, 0.7)',
      })
    );
    sciChartRef.current = { sciChartSurface, wasmContext };

    return { sciChartSurface };
  };

  const updateSpectrogram = useCallback(() => {
    if (!heatmapSeriesRef.current || !sciChartRef.current) return;

    // Fetch the current sciChartRef for updating, no need for wasm context
    const { sciChartSurface } = sciChartRef.current;

    // Destructure the spectrogram data recvd from ws
    const { frequencies, times, spectrogramDb }: SpectrogramDataType =
      spectrogramData;

    if (!frequencies.length || !times.length || !spectrogramDb.length) return;

    // Append new data to intensitiesRef, and remove the oldest if necessary

    intensitiesRef.current.shift(); // Remove the oldest data to keep within the limit

    console.log('NO. OF TIME SLICES: ', times.length);
    console.log('NO. OF FREQUENCY BINS: ', frequencies.length);
    lastDataRef.current = spectrogramData;

    intensitiesRef.current.push(...spectrogramDb); // Append the new data

    // Updating the heatmap data series with the new intensities
    const updatedHeatmapDataSeries = heatmapSeriesRef.current
      .dataSeries as UniformHeatmapDataSeries;

    updatedHeatmapDataSeries.setZValues(intensitiesRef.current);

    heatmapSeriesRef.current.dataSeries = updatedHeatmapDataSeries;
    sciChartSurface.invalidateElement(); // Re-render the chart, might re-render the whole chart which can be inefficient
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
      <div className="controls">
        <Button onPress={connect} disabled={isConnected}>
          Connect
        </Button>
        <Button onPress={disconnect} disabled={!isConnected}>
          Disconnect
        </Button>
        <span
          className={`status ${isConnected ? 'connected' : 'disconnected'}`}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
};

export default SpectrogramView;
