import { useRef, useEffect } from 'react';
import { SmoothieChart, TimeSeries } from 'smoothie';

interface WaveformProps {
  channelData: Float32Array;
  setAutoListen: boolean;
}

const Waveform = ({ channelData, setAutoListen }: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothieChartRef = useRef<SmoothieChart | null>(null);
  const timeSeriesRef = useRef<TimeSeries | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

      // Will always be false, only here to remove TS error
      if (!canvasRef.current) return;

      smoothieChartRef.current.streamTo(canvasRef.current);
    }

    if (!timeSeriesRef.current) {
      timeSeriesRef.current = new TimeSeries();
      smoothieChartRef.current.addTimeSeries(timeSeriesRef.current, {
        strokeStyle: 'rgb(0, 255, 0)',
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

      const sampleValue = channelData[index] || 0;
      timeSeriesRef.current.append(Date.now(), sampleValue);

      index = (index + step) % bufferLength;
      animationFrameRef.current = requestAnimationFrame(updateChart);
    };
    updateChart();
  };

  // Buffer data when component mounts
  useEffect(() => {
    if (!channelData || !setAutoListen) return;

    try {
      // Initialize chart
      if (canvasRef.current) {
        initChart();
        startWaveformDisplay(channelData);
      }
    } catch (err) {
      console.error('Error processing audio:', err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [channelData, setAutoListen]);

  return (
    <div className="w-full p-2 bg-gray-700 rounded-lg border border-gray-700">
      <canvas ref={canvasRef} width="900" height="130" className="max-w-full" />
    </div>
  );
};

export default Waveform;
