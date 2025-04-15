import { downloadWavFile } from '../api/wavFileApi';
import wavIcon from '/assets/icons/wav-icon.png';
import downloadIcon from '/assets/icons/download-symbol-svgrepo-com.svg';

interface WavFileEntryProps {
  size: number;
  datetime: string;
  length: number;
  objectName: string;
  fileName: string;
}

const WavFileEntry = ({
  size,
  datetime,
  length,
  objectName,
  fileName,
}: WavFileEntryProps) => {
  return (
    <div className="flex items-center justify-between p-4 mb-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center flex-1">
        <div className="flex-shrink-0 mr-4">
          <img src={wavIcon} alt="WAV file" className="w-10 h-10" />
        </div>

        <div className="flex flex-col">
          <h3 className="text-lg font-medium text-gray-800">{fileName}</h3>
          <div className="flex flex-wrap gap-x-6 text-sm text-gray-600">
            <span>{size}</span>
            <span>{length}</span>
            <span>{datetime}</span>
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
