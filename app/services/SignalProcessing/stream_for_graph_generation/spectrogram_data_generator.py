from scipy import signal
from scipy.io import wavfile
import numpy as np
import io

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
        self.n_segment= 512
        self.color_scale_min = -40
        self.max_displayed_frequency = 1000
    
    def process_wav_chunk(self, wav_data: bytes):

        wav_file = io.BytesIO(wav_data)
        sample_rate, samples = wavfile.read(wav_file)

        frequencies, times, spectrogram = signal.spectrogram(samples, sample_rate, window=self.window_type, nperseg=self.n_segment, detrend=False)
        sx_db = 10 * np.log10(spectrogram/spectrogram.max())

        # Removes DC offset and noramlize
        samples = samples - np.mean(samples)

        return frequencies.tolist(), times.tolist(), sx_db.tolist()
            