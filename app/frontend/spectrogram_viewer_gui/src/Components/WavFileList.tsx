import { Accordion, AccordionItem } from '@heroui/react';
import {
  getWavFiles,
  downloadWavFile,
  GetObjectsResponse,
} from '../api/wavFileApi';
import audioLibrary from './assets/icons/audio_folder.png';
import { useState, useEffect } from 'react';

const WavFileList = () => {
  const [wavFiles, setWavFiles] = useState<GetObjectsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWavFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWavFiles();
      console.log(response);
      setWavFiles(response);
    } catch (err) {
      setError('Failed to fetch WAV files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <Accordion className="rounded shadow-lg">
        <AccordionItem onPress={fetchWavFiles} title="WAV Files">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : wavFiles && wavFiles.length > 0 ? (
            <ul>
              {wavFiles.map((file) => (
                <li key={file.object_name} className="py-1">
                  {file.object_name}
                </li>
              ))}
            </ul>
          ) : (
            <p>No WAV files found</p>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default WavFileList;
