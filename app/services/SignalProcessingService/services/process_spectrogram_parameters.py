import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy import signal
from scipy.io import wavfile
import numpy as np
import grpc_generated_files.grpc_stub_for_spectrogram_regeneration.spectrogram_generator_service_pb2 as spectrogram_generator_service_pb2
from app.services.SignalProcessingService.utilities.utils import butter_highpass_filter
import io

class SpectrogramPlotter:
    
    window_type: str
    n_segment: int
    highpass_cutoff: int
    lowpass_cutoff: int # Unused, no lowpass function supplied yet
    color_scale_min: int
    max_displayed_frequency: int
    wav_data: bytes

    def __init__(self, params: spectrogram_generator_service_pb2.SpectrogramGeneratorRequest):
        self.window_type = params.window_type
        self.n_segment= params.n_segment
        self.highpass_cutoff = params.highpass_cutoff
        self.lowpass_cutoff = params.lowpass_cutoff
        self.color_scale_min = params.color_scale_min
        self.max_displayed_frequency = params.max_displayed_frequency
        self.wav_data = params.wav_data
    
    def plot_and_save_spectrogram(self, x: list[float], fs: int, window, n_segment: int, f_max: int, s_min) -> bytes:
            
        f, t, sx = signal.spectrogram(x, fs, window=window, nperseg=n_segment, detrend=False)
        sx_db = 10*np.log10(sx/sx.max())   # Convert to dB
             
        fig, ax = plt.subplots(figsize=(16, 6))
        
        cax = ax.pcolormesh(t, f, sx_db, vmin=s_min, cmap='inferno', shading='auto')
                
        ax.set_xlabel("Time [s]")
        ax.set_ylabel("Frequency [Hz]")
        ax.set_ylim(0, f_max)
                
        fig.colorbar(cax, label="Magnitude [dB]")
        
        img_byte_array = io.BytesIO()
        plt.savefig(img_byte_array, format='webp', dpi=300, bbox_inches='tight', transparent = True)
        img_byte_array.seek(0)
        plt.close(fig)
        return img_byte_array.getvalue()
    
    def process_wav_file(self, wav_data: bytes, highpass_cutoff: int):

        wav_file = io.BytesIO(wav_data)

        sample_rate, samples = wavfile.read(wav_file)

        times = np.arange(len(samples)) / sample_rate

        x1 = samples - np.mean(samples)
        return x1, times, sample_rate
        
        