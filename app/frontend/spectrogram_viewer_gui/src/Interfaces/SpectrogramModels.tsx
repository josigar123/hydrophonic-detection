export interface SpectrogramParameterRequestBody {
  windowType: string;
  nSamples: number;
  frequencyCutoff: number;
  frequencyMax: number;
  spectrogramMin: number;
  uri: string;
}

export interface SpectrogramParameterResponseBody {
  imageBlob: Blob;
}
