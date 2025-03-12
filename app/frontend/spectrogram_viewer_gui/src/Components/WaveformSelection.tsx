import { Button } from '@heroui/button';
import { useAudioStream } from '../Hooks/useAudioStream';
import Waveform from './Waveform';
import { Tabs, Tab } from '@heroui/tabs';
import { convert16BitPcmToFloat32Arrays } from '../utils/convert16BitPcmToFloat32Arrays';
import { useEffect, useState } from 'react';

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

interface WaveformSelectionProps {
  numChannels: number;
}

const websocketUrl = 'ws://localhost:8766?client_name=waveform_client';

const WaveformSelection = ({ numChannels }: WaveformSelectionProps) => {
  // Audiodata is recieved through the websocket as raw 16-bit PCM data
  const { audioData, isConnected, error, connect, disconnect } = useAudioStream(
    websocketUrl,
    false
  );

  const [channels, setChannels] = useState<Float32Array[]>([]);

  useEffect(() => {
    if (!audioData || !isConnected) return;

    const extractedChannels: Float32Array[] = convert16BitPcmToFloat32Arrays(
      audioData,
      numChannels
    );

    setChannels(extractedChannels);
  }, [audioData, isConnected, numChannels]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      )}

      <Tabs
        key="bordered"
        aria-label="Signal choice"
        size="sm"
        radius="sm"
        className="mb-6"
      >
        {channels.map((channelData, index) => (
          <Tab key={index} title={`Channel ${index + 1}`}>
            <Waveform channelData={channelData} setAutoListen={true} />
          </Tab>
        ))}
      </Tabs>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          onPress={connect}
          disabled={isConnected}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect to stream
        </Button>
        <Button
          onPress={disconnect}
          disabled={!isConnected}
          className="bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Disconnect from stream
        </Button>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="flex items-center">
          <span className="mr-2">Connection status:</span>
          <span
            className={`font-medium ${isConnected ? 'text-green-600' : 'text-gray-600'}`}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {isConnected && (
            <span className="ml-2 h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
          )}
        </p>
      </div>
    </div>
  );
};

export default WaveformSelection;
