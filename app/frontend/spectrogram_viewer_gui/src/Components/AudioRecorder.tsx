import { useRef, useEffect, useState } from 'react';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { useAudioStream } from '../Hooks/useAudioStream';
import { Button } from '@heroui/button';

// Nice bg colour: #232323

const websocketUrl = 'ws://10.0.0.13:8765';

const AudioRecorder = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothieChartRef = useRef<SmoothieChart | null>(null);
  const timeSeriesRef = useRef<TimeSeries | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { audioData, isConnected } = useAudioStream(websocketUrl);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !isConnected) return;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (listening) {
      audioCtxRef.current = new AudioContext();
      analyserNodeRef.current = audioCtxRef.current.createAnalyser();
      analyserNodeRef.current.fftSize = 256;

      if (audioData == null) return;

      audioCtxRef.current.decodeAudioData(audioData.buffer, (buffer) => {
        const source = audioCtxRef.current!.createBufferSource();
        source.buffer = buffer;

        if (analyserNodeRef.current) {
          source.connect(analyserNodeRef.current);
        }
        source.start();
      });

      const bufferLength = analyserNodeRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

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

      const updateChart = () => {
        if (!analyserNodeRef.current || !timeSeriesRef.current) return;

        analyserNodeRef.current.getByteTimeDomainData(dataArray);

        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

        timeSeriesRef.current.append(new Date().getTime(), average);

        animationFrameRef.current = requestAnimationFrame(updateChart);
      };

      updateChart();
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioData, isConnected, listening]);

  const handleStartListening = () => {
    setListening(true);
  };

  const handleStopListening = () => {
    setListening(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <canvas
        ref={canvasRef}
        width="800"
        height="300"
        className="bg-[#232323] rounded-lg mb-4"
      ></canvas>
      <Button onPress={handleStartListening}>Start Listening</Button>
      <Button onPress={handleStopListening}>Stop Listening</Button>
    </div>
  );
};

export default AudioRecorder;
