from scipy import signal
from scipy.io import wavfile
import numpy as np
import grpc_generated_files.grpc_stub_for_spectrogram_streaming.spectrogram_pb2 as spectrogram_pb2
import io

class SpectrogramStreamer:
    
    window_type: str
    n_segment: int
    highpass_cutoff: int
    lowpass_cutoff: int # Unused, no lowpass function supplied yet
    color_scale_min: int
    max_displayed_frequency: int
    
    # Constructor with default values
    def __init__(self):
        self.window_type = "hann"
        self.n_segment= 256
        self.highpass_cutoff = 100
        self.lowpass_cutoff = 100
        self.color_scale_min = -40
        self.max_displayed_frequency = 1000
    
    def update_params(self, params: spectrogram_pb2.SpectrogramParams):
        self.window_type = params.window_type
        self.n_segment= params.n_segment
        self.highpass_cutoff = params.highpass_cutoff
        self.lowpass_cutoff = params.lowpass_cutoff
        self.color_scale_min = params.color_scale_min
        self.max_displayed_frequency = params.max_displayed_frequency
        self.wav_data = params.wav_data
        print("Updated params:", self.__dict__)

    def process_wav_chunk(self, wav_data: bytes):

        wav_file = io.BytesIO(wav_data)
        sample_rate, samples = wavfile.read(wav_file)

        f, t, sx = signal.spectrogram(samples, sample_rate, window=self.window_type, nperseg=self.n_segment, detrend=False)
        sx_db = 10 * np.log10(sx/sx.max())

        # Removes DC offset and noramlize
        samples = samples - np.mean(samples)

        return f.tolist(), t.tolist(), sx_db.tolist()
            