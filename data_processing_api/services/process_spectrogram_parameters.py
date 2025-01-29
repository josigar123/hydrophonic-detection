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
    
    def plot_spectrogram(self, x: list[float], t: list[float], fs: int, window, n_segment: int, f_max: int, output_path: str) -> int:
        s_min = -40 # Minimum on the intensity plot. Lower values are 'black'
            
        # Calculate spectrogram
        f, t, sx = signal.spectrogram(x, fs, window=window, nperseg=n_segment, detrend=False)
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
    
    def process_wav_files_in_directory(self, target_directory, fmax, spectrogram_output):
        for item in os.listdir(target_directory):
            if item.endswith('.wav'):
                file_path = os.path.join(target_directory, item)
                try:
                    sample_rate, samples = wavfile.read(file_path)

                    times = np.arange(len(samples) / sample_rate) # TODO: MIGHT NOT WORK AS EXPECTED

                    FREQUENCY_CUTOFF = 100
                    x1 = butter_highpass_filter(samples, FREQUENCY_CUTOFF, sample_rate)
                    
                    png_item = item.replace(".wav", ".png")
                    n_samples = self.n_samples
                    ok = self.plot_spectrogram(x1, times, sample_rate, n_samples, fmax, (spectrogram_output +"/"+png_item))
                    #pk = plot_spectrum(x1, sample_rate, fmax, (spectrum_output+"/"+jpeg_item))

                    t1 = np.linspace(0,(len(samples)/sample_rate),len(samples))
                    #sig = plot_signal(samples,t1, (signal_output+"/"+png_item))

                    print(f"Processed file: {item}")
                    print(f"Sample rate: {sample_rate}")
                    
                except Exception as e:
                    print(f"Error processing file {item}: {e}")