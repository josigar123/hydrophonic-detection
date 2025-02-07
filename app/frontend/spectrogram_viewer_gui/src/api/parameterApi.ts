import axios from 'axios';
import {
  SpectrogramParameterRequestBody,
  SpectrogramParameterResponseBody,
} from '../Interfaces/SpectrogramModels';

const base_url = 'http://localhost:5019/api/v1/';
export async function postParametersSpectrogram(
  endpoint: string,
  payload: SpectrogramParameterRequestBody
): Promise<SpectrogramParameterResponseBody> {
  try {
    const response = await axios.post(base_url + endpoint, payload, {
      responseType: 'blob',
    });

    return { imageBlob: response.data };
  } catch (error) {
    console.error('Error fetching plot from ' + endpoint + ': ', error);
    throw error;
  }
}
