from scipy import signal
import numpy as np
from utils import spec_hfilt2, medfilt_vertcal_norm

'''

This file will be used to handle streaming of the spectrogram data generated
by the wav-chunks recieved from the PI

'''
class SpectrogramDataGenerator:
    
    window_type: str
    n_segment: int
    color_scale_min: int
    max_displayed_frequency: int
    
    # Constructor with default values
    def __init__(self):
        self.window_type = "hann"
        self.n_segment= 256
        self.color_scale_min = -40
        self.max_displayed_frequency = 1000
    
    def process_audio_chunk(self, pcm_data: bytes, sample_rate: int, bit_depth: int = 16, channels: int = 1):

        if bit_depth == 16:
            samples = np.frombuffer(pcm_data, dtype=np.int16)
        else:
            raise ValueError(f"Unsupported bit depth: {bit_depth}")

        if channels > 1:
            samples = samples.reshape(-1, channels)

            # First channel
            samples = samples[:, 0]

        # Removes DC offset and noramlize
        samples = samples - np.mean(samples)

        frequencies, times, spectrogram = signal.spectrogram(samples, sample_rate, window=self.window_type, nperseg=self.n_segment, detrend=False)
        sx_db = 10 * np.log10(spectrogram/spectrogram.max())

        return frequencies.tolist(), times.tolist(), sx_db.tolist()

    # hfilt_length determines the minimum length of the audio signal to be supplied to the function
    def create_spectrogram_data(self, pcm_data: bytes, sample_rate: float, channels: int, tperseg: float, freq_filt: int, hfilt_length: int, window: str, bit_depth: int = 16):
        """Plot spectrogram of signal x.

        Parameters
        ----------
        x: array of floats
            Signal in time-domain
        fs: float
            Sample rate [Samples/s]
        tperseg: float
            Time resolution of spectrogram [s]
        f_max: float
            Max. on frequency axis, value should only have a use in frontend
        freq_filt: int (odd)
            Number of frequency bins for smoothing and normalizing
        hfilt_length: int
            Number of time bins for horizontal smoothing
        s_min: int
            Minimum intensity of plot, only on frontend
        s_max: int
            Maximum intensity of plot, only on frontend
        """       

        if bit_depth == 16:
            samples = np.frombuffer(pcm_data, dtype=np.int16)
        else:
            raise ValueError(f"Unsupported bit depth: {bit_depth}")

        samples = samples.reshape(-1, channels)
        # Convert multi-channels audio to mono
        mono_signal = np.mean(samples, axis=1)

        # Calculate spectrogram
        nperseg=int(tperseg*sample_rate)
        f, t, sx = signal.spectrogram(mono_signal, sample_rate, window, nperseg=nperseg, detrend=False)
        sx_norm = medfilt_vertcal_norm(sx,freq_filt)
        sx_db = 10*np.log10(sx_norm)   # Convert to dB
        sx_db, f, t = spec_hfilt2(sx_db,f,t,window_length=hfilt_length)

        return f.tolist(), t.tolist(), sx_db.tolist()
            