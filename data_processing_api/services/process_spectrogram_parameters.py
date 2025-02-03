import matplotlib.pyplot as plt
from scipy import signal
from scipy.io import wavfile
import numpy as np
from models.spectrogram_parameter_model import SpectrogramParameterModel
import os
from utils import butter_highpass_filter

class SpectrogramPlotter:
    
    window_type: any
    n_samples: int
    frequency_cutoff: int
    uri: str
    
    def __init__(self, spectrogramParameters: SpectrogramParameterModel):
        self.filter_type = spectrogramParameters.window_type
        self.n_samples = spectrogramParameters.n_samples
        self.frequency_cutoff = spectrogramParameters.frequency_cutoff
        self.uri = spectrogramParameters.uri
    
    def plot_and_save_spectrogram(self, x: list[float], t: list[float], fs: int,  output_path: str, window=("tukey", 0.25), n_samples: int = 5200, f_max: float = 1e3) -> int:
        s_min = -40 # Minimum on the intensity plot. Lower values are 'black'
            
        f, t, sx = signal.spectrogram(x, fs, window=window, nperseg=n_samples, detrend=False)
        sx_db = 10*np.log10(sx/sx.max())   # Convert to dB
                
        plt.figure(figsize=(16, 6))	
        plt.subplot(1, 1, 1)
        
        plt.pcolormesh(t, f, sx_db, vmin=s_min, cmap='inferno')  # Draw spectrogram image
                
        plt.xlabel("Time [s]")
        plt.ylabel("Frequency [Hz]")
        plt.ylim(0, f_max)
                
        plt.colorbar(label="Magnitude [dB]")
        plt.savefig(output_path, format="png", dpi=300)
        return 0
    
    def process_wav_file(self, path_to_wav: str):
        if path_to_wav.endswith('.wav'):
                
            sample_rate, samples = wavfile.read(path_to_wav)

            times = np.arange(len(samples)) / sample_rate

            FREQUENCY_CUTOFF = 100
            x1 = butter_highpass_filter(samples, FREQUENCY_CUTOFF, sample_rate)
            return x1, times, sample_rate
        else:
            FileNotFoundError()
                
        
        