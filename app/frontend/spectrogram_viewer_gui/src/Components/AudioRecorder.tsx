import { useState, useRef, useEffect } from 'react';
import { Button } from '@heroui/button';
import { SmoothieChart, TimeSeries } from 'smoothie';

// Nice bg colour: #232323

const mimeType = 'audio/webm';

const AudioRecorder = () => {
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [recordingStatus, setRecordingStatus] = useState('inactive');
  const audioChunks = useRef<Blob[]>([]);
  const [audio, setAudio] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const smoothieChartRef = useRef<SmoothieChart | null>(null);
  const timeSeriesRef = useRef<TimeSeries | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    getMicrophonePermission();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !stream) return;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    audioCtxRef.current = new AudioContext();
    analyserNodeRef.current = audioCtxRef.current.createAnalyser();
    analyserNodeRef.current.fftSize = 256;

    const source = audioCtxRef.current.createMediaStreamSource(stream);
    source.connect(analyserNodeRef.current);

    if (!smoothieChartRef.current) {
      smoothieChartRef.current = new SmoothieChart();
      smoothieChartRef.current.streamTo(canvasRef.current);
    }

    if (!timeSeriesRef.current) {
      timeSeriesRef.current = new TimeSeries();
      smoothieChartRef.current.addTimeSeries(timeSeriesRef.current);
    }

    const bufferLength = analyserNodeRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateChart = () => {
      if (!analyserNodeRef.current || !timeSeriesRef.current) return;

      analyserNodeRef.current.getByteTimeDomainData(dataArray);

      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

      timeSeriesRef.current.append(new Date().getTime(), average);

      animationFrameRef.current = requestAnimationFrame(updateChart);
    };

    updateChart();

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  const getMicrophonePermission = async () => {
    if ('MediaRecorder' in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(streamData);
      } catch (error) {
        alert(error);
      }
    } else {
      alert('Audio will not work since you did not accept');
    }
  };

  const startRecording = async () => {
    try {
      setRecordingStatus('recording');

      if (!stream) {
        throw new Error('No audio permission');
      }
      mediaRecorder.current = new MediaRecorder(stream, { mimeType });

      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0 && !(typeof event.data === 'undefined')) {
          audioChunks.current?.push(event.data);
        }
      };

      mediaRecorder.current.start();
    } catch (error) {
      console.error('Error during recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      setRecordingStatus('inactive');

      if (!mediaRecorder.current) {
        throw new Error('No media recorder available');
      }
      mediaRecorder.current.stop();
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudio(audioUrl);
      };
    } catch (error) {
      console.error('Error during stop recording:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <canvas
        ref={canvasRef}
        width="800"
        height="300"
        className="bg-[#232323] rounded-lg mb-4"
      ></canvas>

      <div className="flex gap-4">
        <Button
          onPressStart={startRecording}
          disabled={recordingStatus === 'recording'}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          Start Recording
        </Button>

        <Button
          onPressStart={stopRecording}
          disabled={recordingStatus === 'inactive'}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Stop Recording
        </Button>
      </div>
    </div>
  );
};

export default AudioRecorder;
