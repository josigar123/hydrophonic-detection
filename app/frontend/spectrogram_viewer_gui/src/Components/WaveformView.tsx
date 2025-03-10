import { useRef, useEffect, useState } from 'react';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { useAudioStream } from '../Hooks/useAudioStream';
import { Button } from '@heroui/button';

/*

  Audio is recorded constantly with the following parameters:

    sample rate: 10000 Hz,
    channels: 4 (testing with 1)
    chunks: 1024
    format: 16-bit int

  We have 2 byte per sample, and recv a payload of 2 * 1024 * channels of audio data
  
  When multichanneled PCM interleaves it into a 1D array
  must parse each channel so that they can all be displayed individually

  ex:
    [sample0_ch1, sample0_ch2, sample0_ch3, sample0_ch4, 
      sample1_ch1, sample1_ch2, sample1_ch3, sample1_ch4, 
      sample2_ch1, sample2_ch2, sample2_ch3, sample2_ch4, ...]

  Maybe downsample each signal for less data?
*/

const websocketUrl = 'ws://localhost:8766?client_name=waveform_client';
const SAMPLE_RATE = 41000;
const CHANNELS = 1;

const WaveformView = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothieChartRef = useRef<SmoothieChart | null>(null);
  const timeSeriesRef = useRef<TimeSeries | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audiodata is recieved through the websocket as raw 16-bit PCM data
  const { audioData, isConnected, error, connect, disconnect } = useAudioStream(
    websocketUrl,
    false
  );
  const [listening, setListening] = useState(false);

  const convert16BitPcmToFloat32Arrays = (
    audioData: ArrayBuffer,
    numChannels: number
  ): Float32Array[] => {
    const dataView = new DataView(audioData);
    const numSamples = dataView.byteLength / 2 / numChannels; // No. samples per channel

    // Creates array for each channel
    const channels: Float32Array[] = Array.from(
      { length: numChannels },
      () => new Float32Array(numSamples)
    );

    // Deinterleave the PCM chunk
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const pcmValue = dataView.getInt16((i * numChannels + ch) * 2, true);
        channels[ch][i] = pcmValue / 32768.0;
      }
    }

    return channels; // This array contains numChannels float32arrays
  };

  // TODO: Write a function for generating AudioBuffers of channels for playback

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

  // Call this function for each signal from the array returned from convert16BitPcmToFloat32Arrays
  const startWaveformDisplay = (channel: Float32Array) => {
    let index = 0;
    const bufferLength = channel.length;
    const step = Math.floor(bufferLength / 1000); // Step for reducing resolution

    const updateChart = () => {
      if (!timeSeriesRef.current) return;

      const sampleValue = channel[0] || 0;
      timeSeriesRef.current.append(Date.now(), sampleValue);

      index = (index + step) % bufferLength;

      // Tech-debt, for full resolution of recieved data
      /*
      for (let i = 0; i < bufferLength; i++) {
        const sampleValue = channel[i] || 0;
        timeSeriesRef.current.append(Date.now(), sampleValue);
      }
        */
      animationFrameRef.current = requestAnimationFrame(updateChart);
    };
    updateChart();
  };
  useEffect(() => {
    if (!canvasRef.current || !isConnected || !listening || !audioData) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }

      const channels: Float32Array[] = convert16BitPcmToFloat32Arrays(
        audioData,
        CHANNELS
      );

      initChart();
      // From the channels we need to create AudioBuffers since WebAudioApi cannot process raw
      // Float32Arrays
      startWaveformDisplay(channels[0]); // Call for each channel when multichannel
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
      <div className="mb-4">
        <p>Connection status: {isConnected ? 'Connected' : 'Disconnected'}</p>
        {error && <p className="text-red-500">Error: {error}</p>}
      </div>
      <Button onPress={connect} disabled={isConnected}>
        Connect to stream
      </Button>
      <Button onPress={disconnect} disabled={!isConnected}>
        Disconnect from stream
      </Button>
      <Button onPress={handleStartListening}>Listen</Button>
      <Button onPress={handleStopListening}>Stop Listening</Button>
    </div>
  );
};

export default WaveformView;
