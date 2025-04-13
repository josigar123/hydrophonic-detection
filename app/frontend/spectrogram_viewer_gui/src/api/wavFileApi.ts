import axios from 'axios';

const BASE_API_URL = 'http://127.0.0.1:8000';

interface MinioObject {
  object_name: string;
  size: number;
  last_modified: string;
}

interface FileDownloadResponse {
  status: string;
  file_saved_to: string;
}

export type GetObjectsResponse = MinioObject[];

export const getWavFiles = async (): Promise<GetObjectsResponse> => {
  const request_url = `${BASE_API_URL}/objects`;

  const response = await axios.get(request_url);

  return response.data;
};

export const downloadWavFile = async (
  object_name: string,
  destination: string
): Promise<FileDownloadResponse> => {
  const request_url = `${BASE_API_URL}/download?object_name=${object_name}&destination=${destination}`;

  const response = await axios.get(request_url);

  return response.data;
};
