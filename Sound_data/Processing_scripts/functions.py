import matplotlib.pyplot as plt
from scipy import signal
from scipy.io import wavfile
from scipy.fft import fft, fftshift, fftfreq	# FFT and helper functions
import numpy as np


def plot_spectrogram(x, t, fs, n_segment, f_max, output_path):
    """Plot spectrogram of signal x.

    Parameters
    ----------
    x: array of floats
        Signal in time-domain
    t: Numpy array of floats
        Time vector for x
    fs: float
        Sample rate [Samples/s]
    n_segmend: int
        No. of samples in segment for spctrogram calculation
    f_max: float
        Max. on frequency axis
    """
    # Configure spectrogram
    s_min = -40       # Minimum on the intensity plot. Lower values are 'black'
		
    # Calculate spectrogram
    f, t, sx = signal.spectrogram(x, fs, nperseg=n_segment, detrend=False)
    sx_db = 10*np.log10(sx/sx.max())   # Convert to dB
    		
    # Plot spectrogram
    plt.figure(figsize=(16, 6))  # Define figure for results	
    plt.subplot(1, 1, 1)
    
    plt.pcolormesh(t, f, sx_db, vmin=s_min, cmap='inferno')  # Draw spectrogram image
    		
    plt.xlabel("Time [s]")         # Axis labels and scales
    plt.ylabel("Frequency [Hz]")
    plt.ylim(0, f_max)
    		
    plt.colorbar(label="Magnitude [dB]")  # Colorbar for intensity scale
    plt.savefig(output_path, format="png", dpi=300)
    return 0

def plot_spectrum(x, fs, fmax, output_path):
    """Plot Fourier coefficients of signal x.

    Parameters
    ----------
    x: array of float
        Signal in time-domain
    fs: float
        Sample rate [Samples/s]
    fmax : float
        Maximum on frequency axis
    """
    n_samples = len(x)            # No. of samples in signal
    ft_x = fft(x)/n_samples       # Fourier coefficients, correctly scaled
    f = fftfreq(n_samples, 1/fs)  # Frequency vector
    f = fftshift(f)               # Move negative frequencies to start
    ft_x = fftshift(ft_x)

    # Plot Fourier coefficients
    plt.figure(figsize=([16, 4]))	 # Define figure for plots

    plt.subplot(1, 2, 1)          # Subplot for magnitudes
    plt.stem(f, np.abs(ft_x))	  # Magnitude of spectral components as stem-plot
    plt.xlabel("Frequency [Hz]")
    plt.ylabel("Magnitude")
    plt.xlim(-fmax, fmax)
    plt.grid(True)

    plt.savefig(output_path, format="png", dpi=300)
    """
    plt.subplot(1, 2, 2)          # Subplot for phase
    plt.stem(f, np.angle(ft_x))	  # Phase of spectral components as stem-plot
    plt.xlabel("Frequency [Hz]")
    plt.ylabel("Phase [radians]")
    plt.grid(True)
    plt.xlim(-fmax, fmax)
    """

    return 0

def plot_signal(x, t,output_path):
    """Plot signal x as function of time t.

    Parameters
    ----------
    x: array of float
        Signal in time-domain
    t: array of float
        Time vector
    """
    plt.figure(figsize=([16, 4]))	 # Define figure for plots
    plt.plot(t, x)
    plt.xlabel("Time [s]")
    plt.ylabel("Amplitude")
    plt.grid(True)
    plt.savefig(output_path, format="png", dpi=300)

def butter_highpass(cutoff, fs, order=5):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = signal.butter(order, normal_cutoff, btype='high', analog=False)
    return b, a

def butter_highpass_filter(data, cutoff, fs, order=5):
    b, a = butter_highpass(cutoff, fs, order=order)
    y = signal.filtfilt(b, a, data)
    return y


def Normalization_BroadBand(x,window_length, window_distance, sample_rate):
    #Tar utgangspunkt i at x[0] er det nyeste sample
    """Plot spectrogram of signal x.

    Parameters
    ----------
    x: array of floats
        Signal in time-domain
    window_length: int
        Amount of seconds used for each window
    window_distance: int
        Amount of seconds between each window
    sample_rate: int
        Sample rate of signal x
    """
    Num_samples = window_length * sample_rate
    print(f"Num_samples: {Num_samples}")
    for n in range(Num_samples):
        Energy_sum = x[n]**2
        Nocie_sum = x[n + (window_length+window_distance)*sample_rate -2]**2
    E = Energy_sum/Num_samples
    N = Nocie_sum/Num_samples

    Ratio = E/N
    return Ratio