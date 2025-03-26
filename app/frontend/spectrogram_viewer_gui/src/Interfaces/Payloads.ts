export interface SpectrogramPayload {
  frequencies: number[];
  times: number[];
  spectrogramDb: number[];
}

export interface DemonSpectrogramPayload {
  demonFrequencies: number[];
  demonTimes: number[];
  demonSpectrogramDb: number[];
}

export interface BroadbandPayload {
  broadbandSignal: number[];
  times: number[];
}
