import matplotlib.pyplot as plt
from scipy import signal
from scipy.io import wavfile
from scipy.fft import fft, fftshift, fftfreq    # FFT and helper functions
import numpy as np
from scipy.signal import hilbert, resample_poly
import librosa

def plot_spectrogram(x, fs, n_segment, f_max, s_min, output_path):
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
        No. of samples in segment for spectrogram calculation
    f_max: float
        Max. on frequency axis
    """

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

def plot_spectrogram_from_file(input_file,Fs,n_segment, f_max, s_min):
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
        No. of samples in segment for spectrogram calculation
    f_max: float
        Max. on frequency axis
    """
    data_org, sr = librosa.load(input_file)

    #downsampling original audio data
    data_offcet = resample_poly(data_org,1,int(sr/Fs))

    #Removing dc offset
    Sx = data_offcet - np.mean(data_offcet)

    # Calculate spectrogram
    f, t, sx = signal.spectrogram(Sx, Fs, nperseg=n_segment, detrend=False)
    sx_db = 10*np.log10(sx/sx.max())   # Convert to dB
    		
    # Plot spectrogram
    plt.figure(figsize=(16, 6))  # Define figure for results	
    plt.subplot(1, 1, 1)
    
    plt.pcolormesh(t, f, sx_db, vmin=s_min, cmap='inferno')  # Draw spectrogram image
    		
    plt.xlabel("Time [s]")         # Axis labels and scales
    plt.ylabel("Frequency [Hz]")
    plt.ylim(0, f_max)
    		
    plt.colorbar(label="Magnitude [dB]")  # Colorbar for intensity scale
    plt.show()
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

def Hilbert_DS(input_file, Fs:int ,medfilt_window: int, filter_type: int):
    """
    INPUT:
        input_file: audio file to transform
        
        Fs: int
            Frequency to sample the audio file
        medfilt_window: Odd integer
            NEEDS DESCRIPTION
            also used for downsampling in last stage

    OUTPUT:
        DS_Sx: array of float
            Downsampled hilbert transformed data
        DS_Fs: int
            Sample frequency of DS_Fs
        DS_t: array of float
            Time axis corresponding to DS_Sx
    """
    #Getting data from wav file
    data_org, sr = librosa.load(input_file)

    #downsampling original audio data
    data_offcet = resample_poly(data_org,1,int(sr/Fs))

    #Removing Dc-offcet from data
    dc_offcet = np.mean(data_offcet)
    data = data_offcet - dc_offcet


    #Hilbert transform ov data
    analytic_signal = np.absolute(hilbert(data))
    #Squaring each element
    h_2 = np.square(analytic_signal)

    #If, only for testing purposes. One of the should be the only one
    if filter_type == 1:
        #median filter
        h_filt = signal.medfilt(h_2,medfilt_window)

        #Downsampling
        DS_Sx = resample_poly(h_filt,1,medfilt_window)
        DS_Fs = Fs/medfilt_window
        DS_t = np.linspace(0,(len(DS_Sx)/DS_Fs),len(DS_Sx))
    elif filter_type == 2:
        #filtered and downsampled alternative
        idx_start = 0
        idx_stop = medfilt_window
        num_windows = len(h_2) // medfilt_window
        #Time lost at end of file due to filter_size
        num_samp  = num_windows*medfilt_window
        lost_samp = len(h_2) - num_samp
        lost_time = lost_samp/Fs
        print(f"Due to filter_size mismatch, {lost_time}[s] is lost at end of file")
        h_filt = np.zeros(num_windows-1)
        try:
            for i in range(num_windows):
                h_filt[i] = np.mean(h_2[idx_start:idx_stop])
                idx_start = idx_stop
                idx_stop += medfilt_window
        except:
            print("Last used idx:",idx_start,",",idx_stop)
            print(f"last possible idx to use: {len(h_2)-1}")
            print(h_filt)
        DS_Sx = h_filt
        DS_Fs = Fs/medfilt_window
        DS_t = np.linspace(0,(len(DS_Sx)/DS_Fs),len(DS_Sx))
    else: print("filter_type must be 1 or 2")

    return DS_Sx, DS_Fs, DS_t

def DEMON_Analasys(Sx, Fs:int, nperseg:int,medfilt_window:int,s_min:int,s_max:int):
    """
    INPUT:
        Sx: Array of float
            Time series of measurement values to make spectrogram of
        Fs: int
            Sample frequency of Sx
        nperseg: int
            Num. of samples in each segment
    """
    #Henter ut spectrogram for DEMON (demon_sx)
    demon_f, demon_t, demon_sx = signal.spectrogram(Sx, Fs, nperseg=nperseg, detrend=False)
    
    #med filt over hver kolonne
    demon_sx_med = np.zeros((len(demon_sx),len(demon_sx[0])))
    for k in range(len(demon_sx)):
        demon_sx_med[k,:] = signal.medfilt(demon_sx[k,:],kernel_size=medfilt_window)

    demon_sx_norm = demon_sx/demon_sx_med
    demon_sx_db = 10*np.log(demon_sx_norm)
    
    plt.subplot(1,1,1)
    plt.pcolormesh(demon_t, demon_f, demon_sx_db,vmin=s_min,vmax=s_max, shading='gouraud')
    plt.ylabel("Frequency (Hz)")
    plt.xlabel("Time (s)")
    plt.title("DEMON Spectrogram (Modulation Frequency)")
    plt.colorbar(label="Power (dB)")
    plt.show()
    return 0

def Hilbert_BB(DS_Sx, DS_Fs:int, window_size:int, noice_t_start:int, trigger:int, plot:bool):
    """
        DS_Sx: Array of float
            Time series of measurement values to make spectrogram of
        DS_Fs: int
            Sample frequency of Sx
        window_size: int
            window in seconds
        noice_t_start: int
            start point for mean noice calculation in seconds
    """
    noice_t_stop = int((noice_t_start+window_size)*DS_Fs)
    noice = np.mean(DS_Sx[noice_t_start:noice_t_stop])
    
    """
    For signal kalkulasjon, 2 muligheter:
        1. medfilt over hele DS_Sx, divider så på noice, minus trigger, sjekk for førte verdi over null
            aka. lage ett array med SNR
        
        2. Bruke en løkke til å "Dra" med filt over og kalkulere SNR en og en til terskel er nådd
    """

    #1
    #If even +1, if odd ok
    kernel_size = int(window_size*DS_Fs)+int(int(window_size*DS_Fs) % 2 == 0)

    signal_vals = 10*np.log10(signal.medfilt(DS_Sx,kernel_size)/noice) - trigger
    try:
        indices = np.where(signal_vals > 0)[0]
        Trigger_time = indices[0]/DS_Fs
    except:
        Trigger_time = 0
        print("Warning: Trigger is too high")
        print("No trigger time registerd")

    if plot ==True:
        BBnorm_t = np.linspace(0,(len(signal_vals)/DS_Fs),len(signal_vals))

        plt.figure(figsize=(12,6))

        plt.plot(BBnorm_t,signal_vals + trigger)
        plt.axhline(y=trigger, color='red', linestyle='--', label="Trigger")
        plt.title("BBnorm")
        plt.xlabel("Time [s]")
        plt.ylabel("Amplitude [dB]")
        plt.show()
    
    return Trigger_time