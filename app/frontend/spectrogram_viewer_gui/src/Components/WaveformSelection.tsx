import { useAudioStream } from '../Hooks/useAudioStream';
import Waveform from './Waveform';
import { convert16BitPcmToFloat32Arrays } from '../utils/convert16BitPcmToFloat32Arrays';
import { useContext, useEffect, useState } from 'react';
import { DetectionContext } from '../Contexts/DetectionContext';

/**
 * Audio is recorded constantly with the following parameters:
 * sample rate: 44.1 kHz,
 * channels: 4 (testing with 1)
 * chunks: 1024
 * format: 16-bit int
 * We have 2 byte per sample, and recv a payload of 2 × 1024 × channels of audio data
 * When multichanneled PCM interleaves it into a 1D array
 * must parse each channel so that they can all be displayed individually
 * ex:
 * [sample0_ch1, sample0_ch2, sample0_ch3, sample0_ch4,
 * sample1_ch1, sample1_ch2, sample1_ch3, sample1_ch4,
 * sample2_ch1, sample2_ch2, sample2_ch3, sample2_ch4, ...]
 * Maybe downsample each signal for less data?
 */

interface WaveformSelectionProps {
  numChannels: number;
  isMonitoring: boolean;
}

const websocketUrl = 'ws://localhost:8766?client_name=waveform_client';

const WaveformSelection = ({
  numChannels,
  isMonitoring,
}: WaveformSelectionProps) => {
  // Audiodata is recieved through the websocket as raw 16-bit PCM data
  const { audioData, isConnected, connect, disconnect } = useAudioStream(
    websocketUrl,
    false
  );

  const [channels, setChannels] = useState<Float32Array[]>([]);

  const detectionContext = useContext(DetectionContext);

  if (!detectionContext) {
    throw new Error(
      'In WaveformSelection.tsx: DetectionContext must be used within a DetectionContextProvider'
    );
  }

  const { detection } = detectionContext;

  useEffect(() => {
    if (!audioData || !isConnected || !isMonitoring) return;
    const extractedChannels: Float32Array[] = convert16BitPcmToFloat32Arrays(
      audioData,
      numChannels
    );
    setChannels(extractedChannels);
  }, [audioData, isConnected, isMonitoring, numChannels]);

  useEffect(() => {
    if (isMonitoring) {
      connect();
    } else {
      // channels will have some data, that will be old, wipe it
      setChannels((prev) =>
        prev.map((channel) => new Float32Array(channel.length))
      );
      disconnect();
    }
  }, [connect, disconnect, isMonitoring]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="ml-2">
          {isConnected ? (
            <span className="inline-flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
              Disconnected
            </span>
          )}
        </div>
      </div>

      <div className="h-full flex flex-col bg-slate-800 rounded-lg p-4 shadow-lg">
        <div className="flex-1 w-full relative" style={{ minHeight: '400px' }}>
          {channels.length > 0 ? (
            <div className="flex flex-col h-full space-y-2">
              {channels.map((channelData, index) => {
                const channelKey =
                  `channel${index + 1}` as keyof typeof detection.broadbandDetections.detections;
                return (
                  <div key={index} className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white">Channel {index + 1}</span>
                      <span className="text-gray-400">|</span>
                      {detection.broadbandDetections.detections[channelKey] &&
                      isMonitoring ? (
                        <span className="inline-flex items-center text-green-500">
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                          Detection in channel's broadband
                        </span>
                      ) : !isMonitoring ? (
                        <span className="inline-flex items-center text-gray-50">
                          <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                          No broadband data for channel
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-500">
                          <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                          No detection in channel's broadband
                        </span>
                      )}
                    </div>
                    <Waveform channelData={channelData} setAutoListen={true} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-lg font-medium">No Waveform Data</p>
                <p className="text-sm mt-1">Click Connect to start streaming</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaveformSelection;
