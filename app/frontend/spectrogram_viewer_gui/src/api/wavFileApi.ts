import axios from 'axios';

const BASE_API_URL = 'http://localhost:8000';

interface MinioObject {
  object_name: string;
  size: number;
  last_modified: string;
}

export type GetObjectsResponse = MinioObject[];

export const getWavFiles = async (): Promise<GetObjectsResponse> => {
  const request_url = `${BASE_API_URL}/objects`;

  const response = await axios.get(request_url);

  return response.data;
};

export const downloadWavFile = async (object_name: string): Promise<void> => {
  const request_url = `${BASE_API_URL}/download?object_name=${encodeURIComponent(object_name)}`;

  const response = await axios.get(request_url, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', object_name);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};
