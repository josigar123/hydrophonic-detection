export const convert16BitPcmToFloat32Arrays = (
  audioData: ArrayBuffer,
  numChannels: number
): Float32Array[] => {
  const dataView = new DataView(audioData);
  const numSamples = dataView.byteLength / 2 / numChannels; // No. samples per channel

  // Creates array for each channel
  const channels: Float32Array[] = Array.from(
    { length: numChannels },
    () => new Float32Array(numSamples)
  );

  // Deinterleave the PCM chunk
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const pcmValue = dataView.getInt16((i * numChannels + ch) * 2, true);
      channels[ch][i] = pcmValue / 32768.0;
    }
  }

  return channels; // This array contains numChannels float32arrays
};
