export interface SpectrogramParameterRequestBody {
  windowType: string;
  nSegment: number;
  highpassCutoff: number;
  lowpassCutoff: number;
  colorScaleMin: number;
  maxDisplayedFrequency: number;
  uri: string;
}

export interface SpectrogramParameterResponseBody {
  imageBlob: Blob;
}

export interface SpectrogramData {
  frequencies: number[];
  times: number[];
  spectrogramDb: number[][];
}
