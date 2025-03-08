from scipy import signal
from scipy.io import wavfile
import numpy as np
import io
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
    
    def process_wav_chunk(self, wav_data: bytes):

        wav_file = io.BytesIO(wav_data)
        sample_rate, samples = wavfile.read(wav_file)

        # Removes DC offset and noramlize
        samples = samples - np.mean(samples)

        frequencies, times, spectrogram = signal.spectrogram(samples, sample_rate, window=self.window_type, nperseg=self.n_segment, detrend=False)
        sx_db = 10 * np.log10(spectrogram/spectrogram.max())

        return frequencies.tolist(), times.tolist(), sx_db.tolist()

    def crete_spectrogram_data(self, x, fs, tperseg, freq_filt, hfilt_length, f_max, s_min,s_max):
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

        # Calculate spectrogram
        nperseg=int(tperseg*fs)
        f, t, sx = signal.spectrogram(x, fs, nperseg=nperseg, detrend=False)
        sx_norm = medfilt_vertcal_norm(sx,freq_filt)
        sx_db = 10*np.log10(sx_norm)   # Convert to dB
        sx_db, f, t = spec_hfilt2(sx_db,f,t,window_length=hfilt_length)

        return f.tolist(), t.tolist(), sx_db.tolist()
            