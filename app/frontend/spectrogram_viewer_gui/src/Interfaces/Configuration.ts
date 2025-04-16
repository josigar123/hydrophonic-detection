export interface SpectrogramConfiguration {
  tperseg?: number;
  frequencyFilter?: number;
  horizontalFilterLength?: number;
  windowInMin?: number;
  maxFrequency?: number;
  minFrequency?: number;
  maxDb?: number;
  minDb?: number;
  window?: string;
  narrowbandThreshold?: number;
}

export interface DemonSpectrogramConfiguration {
  demonSampleFrequency?: number;
  tperseg?: number;
  frequencyFilter?: number;
  horizontalFilterLength?: number;
  windowInMin?: number;
  maxFrequency?: number;
  minFrequency?: number;
  maxDb?: number;
  minDb?: number;
  window?: string;
}

export interface ScotConfiguration {
  channel1?: number;
  channel2?: number;
  correlationLength?: number;
  windowInMin?: number;
  refreshRateInSeconds?: number;
}

export interface BroadbandConfiguration {
  broadbandThreshold?: number;
  windowSize?: number;
  hilbertWindow?: number;
  bufferLength?: number;
  windowLength?: number;
}

export interface SpectrogramNarrowbandAndDemonConfiguration {
  spectrogramConfiguration?: SpectrogramConfiguration;
  demonSpectrogramConfiguration?: DemonSpectrogramConfiguration;
  scotConfiguration?: ScotConfiguration;
}
