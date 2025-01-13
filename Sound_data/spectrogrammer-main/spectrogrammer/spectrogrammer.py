import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import soundfile as sf
import os

def plot_spectrogram(spectrogram):
  # Create a single subplot within a figure
  fig, ax = plt.subplots(figsize=(12, 8))
  if len(spectrogram.shape) > 2:
    assert len(spectrogram.shape) == 3
    spectrogram = np.squeeze(spectrogram, axis=-1)
  # Convert the frequencies to log scale and transpose, so that the time is
  # represented on the x-axis (columns).
  # Add an epsilon to avoid taking a log of zero.
  log_spec = np.log(spectrogram.T + np.finfo(float).eps)
  height = log_spec.shape[0]
  width = log_spec.shape[1]
  X = np.linspace(0, np.size(spectrogram), num=width, dtype=int)
  Y = range(height)
  ax.pcolormesh(X, Y, log_spec)
  ax.set_title('Spectrogram')
  plt.show()


def get_spectrogram(path):
    # Load the 8-bit WAV file using soundfile and resave it as 16-bit WAV
    data, samplerate = sf.read(path)
    tempfile = 'converted_audio.wav'
    sf.write(tempfile, data, samplerate, subtype='PCM_16')

    # Now you can decode the converted 16-bit WAV file
    audio = tf.io.read_file(tempfile)
    waveform, sample_rate = tf.audio.decode_wav(audio)

    os.remove(tempfile)

    # Check the number of channels
    num_channels = waveform.shape[-1]  # Get the last dimension (number of channels)

    if num_channels > 1:
        # Convert stereo/multi-channel audio to mono by averaging the channels
        waveform = tf.reduce_mean(waveform, axis=-1, keepdims=True)

    waveform = tf.squeeze(waveform, axis=-1)

    # Convert the waveform to a spectrogram via a STFT.
    spectrogram = tf.signal.stft(
        waveform, frame_length=256, frame_step=128)
    # Obtain the magnitude of the STFT.
    spectrogram = tf.abs(spectrogram)
    # Add a `channels` dimension, so that the spectrogram can be used
    # as image-like input data with convolution layers (which expect
    # shape (`batch_size`, `height`, `width`, `channels`).
    spectrogram = spectrogram[..., tf.newaxis]
    return spectrogram

