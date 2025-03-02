import { useRef, useEffect, useState } from 'react';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { useAudioStream } from '../Hooks/useAudioStream';
import { Button } from '@heroui/button';

const websocketUrl = 'ws://10.0.0.13:8765';
const websocketURL = 'ws://10.0.0.10:8766?client_name=waveform_client';

const AudioRecorder = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothieChartRef = useRef<SmoothieChart | null>(null);
  const timeSeriesRef = useRef<TimeSeries | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { audioData, isConnected, error } = useAudioStream(websocketUrl);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !isConnected || !listening || !audioData) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }

      audioCtxRef.current.decodeAudioData(audioData).then((audioBuffer) => {
        const channelData = audioBuffer.getChannelData(0); // Extract PCM data
        const bufferLength = channelData.length;

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

        let index = 0;
        const step = Math.floor(bufferLength / 1000);

        const updateChart = () => {
          if (!timeSeriesRef.current) return;
          const sampleValue = channelData[index] || 0;
          timeSeriesRef.current.append(new Date().getTime(), sampleValue);

          index = (index + step) % bufferLength;
          animationFrameRef.current = requestAnimationFrame(updateChart);
        };

        updateChart();
      });
    } catch (err) {
      console.error('Error processing audio:', err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [audioData, isConnected, listening]);

  const handleStartListening = () => {
    if (error) {
      console.error('Cannot start listening while there is an error:', error);
      return;
    }
    setListening(true);
  };

  const handleStopListening = () => {
    setListening(false);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      <canvas
        ref={canvasRef}
        width="800"
        height="300"
        className="bg-[#232323] rounded-lg mb-4"
      />
      <Button onPress={handleStartListening}>Start Listening</Button>
      <Button onPress={handleStopListening}>Stop Listening</Button>
    </div>
  );
};

export default AudioRecorder;
