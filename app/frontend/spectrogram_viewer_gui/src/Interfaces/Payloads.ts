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

export interface ScotPayload {
  graphLine: number[];
  crossCorrelationLagTimes: number[][];
}

export interface BroadbandPayload {
  broadbandSignal: number[];
  times: number[];
}
export interface BroadbandDetections {
  detections: {
    channel1?: boolean;
    channel2?: boolean;
    channel3?: boolean;
    channel4?: boolean;
    summarizedDetection?: boolean;
  };
}
