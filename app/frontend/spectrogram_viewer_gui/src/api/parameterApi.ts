import axios from 'axios';

interface DataSpectrogram {
  windowType: string;
  nSamples: number;
  frequencyCutoff: number;
  frequencyMax: number;
  spectrogramMin: number;
  uri: string;
}

interface Response {
  image_blob: Blob;
}

const base_url = 'http://localhost:5019/api/v1/';
export async function postParametersSpectrogram(
  endpoint: string,
  payload: DataSpectrogram
): Promise<Response> {
  try {
    const response = await axios.post(base_url + endpoint, payload, {
      responseType: 'blob',
    });

    return { image_blob: response.data };
  } catch (error) {
    console.error('Error fetching plot from ' + endpoint + ': ', error);
    throw error;
  }
}
