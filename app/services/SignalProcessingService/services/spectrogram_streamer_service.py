from scipy import signal
from scipy.io import wavfile
import numpy as np
from models.spectrogram_parameter_model import SpectrogramParameterModel
import io

class SpectrogramStreamer:
    
    window_type: str
    n_segment: int
    highpass_cutoff: int
    lowpass_cutoff: int # Unused, no lowpass function supplied yet
    color_scale_min: int
    max_displayed_frequency: int
    wav_data: bytes

    def __init__(self, spectrogramParameters: SpectrogramParameterModel):
        self.window_type = spectrogramParameters.window_type
        self.n_segment= spectrogramParameters.n_segment
        self.highpass_cutoff = spectrogramParameters.highpass_cutoff
        self.lowpass_cutoff = spectrogramParameters.lowpass_cutoff
        self.color_scale_min = spectrogramParameters.color_scale_min
        self.max_displayed_frequency = spectrogramParameters.max_displayed_frequency
        self.wav_data = spectrogramParameters.wav_data
    
    def process_wav_chunk(self, wav_data: bytes):

        wav_file = io.BytesIO(wav_data)
        sample_rate, samples = wavfile.read(wav_file)

        f, t, sx = signal.spectrogram(samples, sample_rate, window=self.window_type, nperseg=self.n_segment, detrend=False)
        sx_db = 10 * np.log10(sx/sx.max())

        # Removes DC offset and noramlize
        samples = samples - np.mean(samples)

        return f.tolist(), t.tolist(), sx_db.tolist()
            