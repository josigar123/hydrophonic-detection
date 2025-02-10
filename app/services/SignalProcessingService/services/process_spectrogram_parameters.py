import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy import signal
from scipy.io import wavfile
import numpy as np
from models.spectrogram_parameter_model import SpectrogramParameterModel
import os
from utils import butter_highpass_filter
import io

class SpectrogramPlotter:
    
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
    
    def plot_and_save_spectrogram(self, x: list[float], t: list[float], fs: int, window, n_segment: int, f_max: int, s_min) -> bytes:
            
        f, t, sx = signal.spectrogram(x, fs, window=window, nperseg=n_segment, detrend=False)
        sx_db = 10*np.log10(sx/sx.max())   # Convert to dB
                
        plt.figure(figsize=(16, 6))	
        plt.subplot(1, 1, 1)
        
        plt.pcolormesh(t, f, sx_db, vmin=s_min, cmap='inferno')  # Draw spectrogram image
                
        plt.xlabel("Time [s]")
        plt.ylabel("Frequency [Hz]")
        plt.ylim(0, f_max)
                
        plt.colorbar(label="Magnitude [dB]")
        
        img_byte_array = io.BytesIO()
        plt.savefig(img_byte_array, format='png', dpi=300, bbox_inches='tight', transparent = True)
        img_byte_array.seek(0)
        plt.close()
        return img_byte_array.getvalue()
    
    def process_wav_file(self, wav_data: bytes, highpass_cutoff: int):

        wav_file = io.BytesIO(wav_data)

        sample_rate, samples = wavfile.read(wav_file)

        times = np.arange(len(samples)) / sample_rate

        x1 = butter_highpass_filter(samples, highpass_cutoff, sample_rate)
        return x1, times, sample_rate
                
        
        