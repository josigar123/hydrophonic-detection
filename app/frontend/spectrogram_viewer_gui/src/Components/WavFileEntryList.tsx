import WavFileEntry from './WavFileEntry';
import { getWavFiles, GetObjectsResponse } from '../api/wavFileApi';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/dropdown';
import audioFolder from '/assets/icons/9111080_folder_music_icon.png';
import { Image } from '@heroui/image';
import { Button } from '@heroui/button';
import { useState } from 'react';
import { Spinner } from '@heroui/spinner';

const WavFileEntryList = () => {
  const [wavFilesInfo, setWavFilesInfo] = useState<GetObjectsResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWavFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const objects = await getWavFiles();
      setWavFilesInfo(objects);
    } catch (err) {
      setError('Error fetching WAV files');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dropdown onOpenChange={handleWavFiles}>
      <DropdownTrigger>
        <Button className="flex items-center p-2">
          {isLoading && !error ? (
            <Spinner />
          ) : (
            <Image
              src={audioFolder}
              alt="Audio folder"
              className="w-6 h-6 mr-2"
            />
          )}

          <span>Audio Files</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu>
        <DropdownItem hidden={!error} key="error" textValue={error || 'Error'}>
          {error}
        </DropdownItem>

        {wavFilesInfo && wavFilesInfo.length > 0 ? (
          <>
            {wavFilesInfo.map((fileInfo, index) => (
              <DropdownItem key={index} textValue={`Audio File ${index + 1}`}>
                <WavFileEntry
                  size={fileInfo.size}
                  datetime={fileInfo.last_modified}
                  objectName={fileInfo.object_name}
                  fileName={`WAV${index + 1}`}
                />
              </DropdownItem>
            ))}
          </>
        ) : !isLoading &&
          !error &&
          wavFilesInfo &&
          wavFilesInfo.length === 0 ? (
          <DropdownItem key="empty" textValue="No Files Found">
            No Files Found
          </DropdownItem>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  );
};

export default WavFileEntryList;
