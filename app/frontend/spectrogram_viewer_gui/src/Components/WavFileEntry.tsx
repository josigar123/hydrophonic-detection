import { downloadWavFile } from '../api/wavFileApi';
import wavIcon from '/assets/icons/wav-icon.png';
import downloadIcon from '/assets/icons/download-symbol-svgrepo-com.svg';
import recordingParameters from '../../../../configs/recording_parameters.json';

const sampleRate = recordingParameters['sampleRate'];
const bitDepth = recordingParameters['bitDepth'];
const numChannels = recordingParameters['channels'];

interface WavFileEntryProps {
  size: number;
  datetime: string;
  objectName: string;
  fileName: string;
}

const WavFileEntry = ({
  size,
  datetime,
  objectName,
  fileName,
}: WavFileEntryProps) => {
  function formatBytes(bytes: number): string {
    const units = ['bytes', 'KiB', 'MiB', 'GiB'];
    let i = 0;

    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }

    return `${bytes.toFixed(2)} ${units[i]}`;
  }

  function formatTimestamp(iso: string): string {
    const date = new Date(iso);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  function calculateWavDuration(
    totalBytes: number,
    sampleRate: number,
    bitDepth: number,
    channels: number,
    headerSize = 44 // default for PCM WAV files
  ): number {
    const dataBytes = totalBytes - headerSize;
    const bytesPerSecond = sampleRate * channels * (bitDepth / 8);
    return dataBytes / bytesPerSecond; // seconds
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedMins = String(mins).padStart(2, '0');
    const paddedSecs = String(secs).padStart(2, '0');
    return `${paddedMins}:${paddedSecs}`;
  }

  return (
    <div className="flex items-center justify-between p-4 mb-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center flex-1">
        <div className="flex-shrink-0 mr-4">
          <img src={wavIcon} alt="WAV file" className="w-10 h-10" />
        </div>

        <div className="flex flex-col">
          <h3 className="text-lg font-medium text-gray-800">{fileName}</h3>
          <div className="flex flex-wrap gap-x-6 text-sm text-gray-600">
            <span>{formatBytes(size)}</span>
            <span>
              {formatDuration(
                calculateWavDuration(size, sampleRate, bitDepth, numChannels)
              )}
            </span>
            <span>{formatTimestamp(datetime)}</span>
          </div>
        </div>
      </div>

      <button
        className="flex-shrink-0 p-2 ml-4 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Download file"
      >
        <img
          src={downloadIcon}
          alt="Download"
          className="w-5 h-5"
          onClick={() => downloadWavFile(objectName)}
        />
      </button>
    </div>
  );
};

export default WavFileEntry;
