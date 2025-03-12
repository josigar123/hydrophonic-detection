import { useRef, useEffect, useState } from 'react';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { Button } from '@heroui/button';

interface WaveformProps {
  channelData: Float32Array;
  setAutoListen: boolean;
}

const Waveform = ({ channelData, setAutoListen }: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothieChartRef = useRef<SmoothieChart | null>(null);
  const timeSeriesRef = useRef<TimeSeries | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [listening, setListening] = useState(setAutoListen);

  const initChart = () => {
    if (!smoothieChartRef.current) {
      smoothieChartRef.current = new SmoothieChart({
        grid: {
          strokeStyle: 'rgb(125, 0, 0)',
          fillStyle: 'rgb(60, 0, 0)',
          lineWidth: 1,
          millisPerLine: 250,
          verticalSections: 6,
        },
        labels: { fillStyle: 'rgb(60, 0, 0)' },
        maxValue: 1,
        minValue: -1,
      });
      smoothieChartRef.current.streamTo(canvasRef.current);
    }

    if (!timeSeriesRef.current) {
      timeSeriesRef.current = new TimeSeries();
      smoothieChartRef.current.addTimeSeries(timeSeriesRef.current, {
        strokeStyle: 'rgb(0, 255, 0)',
        fillStyle: 'rgba(0, 255, 0, 0.4)',
        lineWidth: 3,
      });
    }
  };

  const startWaveformDisplay = (channelData: Float32Array) => {
    let index = 0;
    const bufferLength = channelData.length;
    const step = Math.floor(bufferLength / 1000); // Step for reducing resolution of waveform

    const updateChart = () => {
      if (!timeSeriesRef.current) return;

      const sampleValue = channelData[0] || 0;
      timeSeriesRef.current.append(Date.now(), sampleValue);

      index = (index + step) % bufferLength;
      animationFrameRef.current = requestAnimationFrame(updateChart);
    };
    updateChart();
  };
  useEffect(() => {
    if (!canvasRef.current || !listening) return;

    try {
      initChart();
      startWaveformDisplay(channelData);
    } catch (err) {
      console.error('Error processing audio:', err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [listening, channelData]);

  const handleStartListening = () => {
    setListening(true);
  };

  const handleStopListening = () => {
    setListening(false);
  };

  return (
    <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
      <canvas
        ref={canvasRef}
        width="800"
        height="300"
        className="w-full h-auto bg-[#232323] rounded-lg shadow-inner mb-6"
      />
      <div className="flex justify-center gap-4">
        <Button
          onPress={handleStartListening}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Listen
        </Button>
        <Button
          onPress={handleStopListening}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Stop Listening
        </Button>
      </div>
    </div>
  );
};

export default Waveform;
