export interface SpectrogramConfiguration {
  tperseg: number;
  frequencyFilter: number;
  horizontalFilterLength: number;
  windowInMin: number;
  maxFrequency: number;
  minFrequency: number;
  maxDb: number;
  minDb: number;
  window: string;
}

export interface DemonSpectrogramConfiguration {
  demonSampleFrequency: number;
  tperseg: number;
  frequencyFilter: number;
  horizontalFilterLength: number;
  windowInMin: number;
  maxFrequency: number;
  minFrequency: number;
  maxDb: number;
  minDb: number;
  window: string;
}

export interface Configuration {
  spectrogramConfiguration: SpectrogramConfiguration;
  demonSpectrogramConfiguration: DemonSpectrogramConfiguration;
  narrowbandThreshold: number;
  broadbandDetectionThreshold: number;
}
