import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { useSpectrogramStream } from '../Hooks/useSpectrogramStream'; // Import your custom hook
import { Data, Layout, Datum } from 'plotly.js';
import { SpectrogramData } from '../Interfaces/SpectrogramModels';

interface SpectrogramProps {
  autoConnect?: boolean;
}

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';

const RealTimeSpectrogram: React.FC<SpectrogramProps> = ({
  autoConnect = true,
}) => {
  // Use the custom hook to handle WebSocket connection and data
  const { spectrogramData, isConnected, error, connect, disconnect } =
    useSpectrogramStream(websocketUrl, autoConnect);

  // Store historical data to build the full spectrogram
  const [spectrogramHistory, setSpectrogramHistory] = useState<SpectrogramData>(
    {
      frequencies: [],
      times: [],
      spectrogramDb: [],
    }
  );

  useEffect(() => {
    if (
      spectrogramData.frequencies.length > 0 &&
      spectrogramData.times.length > 0 &&
      spectrogramData.spectrogramDb.length > 0
    ) {
      setSpectrogramHistory((prev) => {
        const newTime = spectrogramData.times[spectrogramData.times.length - 1];

        const frequenciesChanged =
          JSON.stringify(prev.frequencies) !==
          JSON.stringify(spectrogramData.frequencies);

        let newFrequencies = prev.frequencies;
        let newMatrix = [...prev.spectrogramDb];

        if (frequenciesChanged) {
          newFrequencies = [...spectrogramData.frequencies];

          newMatrix = prev.spectrogramDb.map((row) => {
            const newRow = Array(newFrequencies.length).fill(null);
            prev.frequencies.forEach((freq, i) => {
              const newIndex = newFrequencies.indexOf(freq);
              if (newIndex !== -1 && i < row.length) {
                newRow[newIndex] = row[i];
              }
            });
            return newRow;
          });
        }

        if (!prev.times.includes(newTime)) {
          newMatrix.push([...spectrogramData.spectrogramDb]);

          const maxTimePoints = 100;
          let newTimes = [...prev.times, newTime];

          if (newMatrix.length > maxTimePoints) {
            newMatrix = newMatrix.slice(-maxTimePoints);
            newTimes = newTimes.slice(-maxTimePoints);
          }

          return {
            frequencies: newFrequencies,
            times: newTimes, // Ensure this is `times`, not `timePoints`
            spectrogramDb: newMatrix, // Ensure this is `spectrogramDb`, not `spectrogramMatrix`
          };
        }

        return prev;
      });
    }
  }, [spectrogramData]);

  const getPlotlyData = (): Data[] => {
    return [
      {
        z: spectrogramHistory.spectrogramDb as Datum[][],
        x: spectrogramHistory.times as Datum[],
        y: spectrogramHistory.frequencies as Datum[],
        type: 'heatmap' as const,
        colorscale: 'Viridis' as const,
        zsmooth: 'best' as const,
      },
    ];
  };

  const layout: Partial<Layout> = {
    title: 'Real-time Spectrogram',
    xaxis: {
      title: 'Time',
      automargin: true,
    },
    yaxis: {
      title: 'Frequency (Hz)',
      automargin: true,
      type: 'log' as const,
    },
    margin: {
      l: 50,
      r: 50,
      b: 50,
      t: 50,
      pad: 4,
    },
    autosize: true,
  };

  const config = {
    responsive: true,
    displayModeBar: true,
  };

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

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

      <div style={{ width: '100%', height: '600px' }}>
        <Plot
          data={getPlotlyData()}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
};

export default RealTimeSpectrogram;
