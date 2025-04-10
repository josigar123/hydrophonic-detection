#Function library for data processing
#Bachelor i havnovervåkning vha hydrofon
#Christoffer Aaseth
#Finished Date: 07.04.2025


import matplotlib.pyplot as plt
from scipy import signal
from scipy.io import wavfile
from scipy.fft import fft, fftshift, fftfreq    # FFT and helper functions
import numpy as np
from scipy.signal import hilbert, resample_poly
import librosa

def plot_spectrogram(x, fs, tperseg, freq_filt, hfilt_length, f_max, s_min,s_max, plot=True):
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
        Max. on frequency axis
    freq_filt: int (odd)
        Number of frequency bins for smoothing and normalizing
    hfilt_length: int
        Number of time bins for horizontal smoothing
    plot: bool
        Determines if plot is generated
    
    Output
    ---------
    t: array of floats
        Time array for spectrogram
    f: array of floats
        frequency array for spectrogram
    sx_db: 2D-array of floats
        Spectrogram values in dB
        
    """

    # Calculate spectrogram
    nperseg=int(tperseg*fs)
    f, t, sx = signal.spectrogram(x, fs, nperseg=nperseg, detrend=False)
    sx_norm = medfilt_vertcal_norm(sx,freq_filt)
    sx_db = 10*np.log10(np.maximum(sx_norm,1e-10))   # Convert to dB
    sx_db, f, t = spec_hfilt2(sx_db,f,t,window_length=hfilt_length)

    if plot:
        # Plot spectrogram
        plt.figure(figsize=(16, 9))  # Define figure for results	
        plt.subplot(1, 1, 1)
        
        plt.pcolormesh(t, f, sx_db, vmin=s_min, vmax=s_max, cmap='inferno')  # Draw spectrogram image
                
        plt.xlabel("Time [s]")         # Axis labels and scales
        plt.ylabel("Frequency [Hz]")
        plt.ylim(0, f_max)
                
        plt.colorbar(label="Magnitude [dB]")  # Colorbar for intensity scale

    return t, f, sx_db

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
    return 0

def butter_highpass(cutoff, fs, order=5):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = signal.butter(order, normal_cutoff, btype='high', analog=False)
    return b, a


def butter_highpass_filter(data, cutoff, fs, order=5):
    b, a = butter_highpass(cutoff, fs, order=order)
    y = signal.filtfilt(b, a, data)
    return y

def butter_lowpass(sig, fs, cutoff=0.9):  # cutoff som andel av Nyquist
    nyq = fs / 2
    b, a = signal.butter(4, cutoff * nyq / nyq, btype='low')
    return signal.filtfilt(b, a, sig)

def load_audiofile(input_file, fs:int, fc_low:float ,remove_offcet=True):
    """
    INPUT:
        input_file: directory to audiofile
        Fds: Frequency to sample audiofilfe
    RETUN:
        sx : discreete audio data
        fs : sample frequency
    """
    # Load audio data from the input file
    data_offcet, fs = librosa.load(input_file, sr=fs)  # Load the file, returns the audio signal and its sampling rate

    b,a = signal.butter(N=4,Wn=fc_low, btype="highpass",fs=fs)
    data_offcet = signal.filtfilt(b,a,data_offcet)   
    if remove_offcet:
        # Remove DC offset by subtracting the mean value
        data = data_offcet - np.mean(data_offcet)  # Remove the mean (DC offset)
        
    else:
        data = data_offcet
    
    return data, fs

def moving_average_padded(signal, window_size=5):
    pad_size = window_size // 2
    padded_signal = np.pad(signal, pad_size, mode='edge')  # Repeat edge values
    padded_left_signal = np.pad(signal,(pad_size,0),mode="constant",constant_values=np.mean(signal[:pad_size]))
    padded_signal = np.pad(padded_left_signal,(0,pad_size),mode="constant",constant_values=np.mean(signal[-pad_size:]))
    kernel = np.ones(window_size) / window_size
    smoothed = np.convolve(padded_signal, kernel, mode="valid")  # Only keep valid parts
    return smoothed

def moving_average_zero_padded(signal, window_size=5):
    pad_size = window_size // 2
    padded_signal = np.pad(signal, pad_size, mode="constant",constant_values=0)  # Repeat edge values
    kernel = np.ones(window_size) / window_size
    smoothed = np.convolve(padded_signal, kernel, mode="full")  # Only keep valid parts
    return smoothed

def BB_data(sx, fs, sx_buff, hilbert_win, window_size):
    """
    Computes the SNR of a time domain audio signal.

    PARAMETERS:
        sx: array of float
            Audio signal in time domain
        fs: int
            samplerate of sx
        sx_buff: array of float
            Buffered processed signal from last segment (Live implementation)
        hilbert_win: int
            No. of samples used for downsamlpling
        window_size: float
            No. of seconds used for filtering

    RETURN:
        BB_sig: array of float
            Logarithmic representation of power-envelope
        t: array of float
            time array corresponding to BB_sig
        sx_buff_out: array of float
            Buffered processed signal from last segment (Live implementation)
    """
    # Apply Hilbert transform to the signal, take the absolute value, square the result (power envelope), and then apply a median filter
    # to smooth the squared analytic signal. The window size for the median filter is defined by `medfilt_window`.
    envelope = moving_average_padded(np.square(np.abs(hilbert(sx))),hilbert_win)

    # Downsample the filtered signal
    DS_Sx = resample_poly(envelope, 1, hilbert_win)  # Resample by the median filter window size
    DS_Fs = fs / hilbert_win  # New sampling rate after downsampling

    # Define kernel size for the median filter based on window size
    kernel_size = int(window_size * DS_Fs) 
    kernel_size = kernel_size - 1 if kernel_size % 2 == 0 else kernel_size # Ensure odd size
    signal_med = moving_average_zero_padded(DS_Sx, kernel_size)  # Apply median filter for further noise removal

    #Removing invalid values
    signal_med = signal_med[kernel_size//2:-kernel_size//2]

    #Adding last of previous to start
    signal_med[:len(sx_buff)] += sx_buff

    #Preparing buffer for next segment
    sx_buff_out = signal_med[-kernel_size:]

    #Cutting end of current
    signal_med = signal_med[:-kernel_size]

    if len(sx_buff) == 0: #Empty buffer
        signal_med = signal_med[kernel_size//2:] #Kutter første del


    BB_sig = 10*np.log10(signal_med)
    t = np.linspace(0,len(BB_sig)/DS_Fs,len(BB_sig))
    return BB_sig, t, sx_buff_out


def DEMON_from_data(sx, fs, Fds,tperseg,freq_filt,hfilt_length ,fmax=100, s_max=10, window="hamming", plot=True):
    #DEMON 2
    """
    Produces a DEMON (Detection of Envelope Modulation On Noise) spectrogram from a time domain audio signal.

    PARAMETERS:
        sx: array_like
            Time series of measurement values

        fs: int
            Sample frequency
        
        Fds: int
            Demon sample frequency

        tperseg: float
            Seconds of audiodata for spectrogram fft
        
        freq_filt: int (odd)
            Number of frequency bins for smoothing and normalizing
        
        hfilt_length: int
            Number of seconds used for horizontal smoothing
        
        fmax: float
            Max frequency for DEMON spectrogram
        
        s_max: float
            Max dB on spectrogram
        
        window: str
            Spectrogram window
    
    RETURN:
        td: 1D array of float
            time array for spectrogram
        fd: 1D array of float
            frequency array for spectrogram
        sxx_db: 2D array of float
            2D array of intencity for spectrogram (dB)
    """

    #RMS data of hilbert
    kernal_size = int(fs/Fds) 
    analytic_signal = np.abs(hilbert(sx))**2
    rms_values = average_filter(analytic_signal, kernal_size)
    
    #hente freq
    nperseg= int(Fds*tperseg) #Number of samples in time axis to use for each vertical spectrogram coloumn

    fd_rms, td_rms, sxx_rms = signal.spectrogram(rms_values,Fds,
                                                    nperseg=nperseg,
                                                    #noverlap=5*nperseg//6,
                                                    window=window
                                                    )


    #Normaliserer sxx
    sxx_rms_norm = medfilt_vertcal_norm(spec=sxx_rms,vertical_medfilt_size=freq_filt)
    sxx_db, fd_rms, td_rms = spec_hfilt2(10*np.log10(sxx_rms_norm),fd_rms,td_rms,window_length=hfilt_length)

    #bandpass cut filter
    fc = 4 #Hz
    sxx_db[0:int(fc*tperseg+1),:] = 0
    sxx_db[-int(fc*tperseg+1):,:] = 0
    
    if plot:
        plt.figure(figsize=(9,9))
        plt.subplot(1, 1, 1)
        plt.pcolormesh(td_rms, fd_rms, sxx_db, vmin=0,vmax=s_max)
        plt.xlabel("Time [s]")
        plt.ylabel("Demon Frequency [Hz]")
        plt.ylim(0,fmax)
        plt.title("sxx_rms_norm")
        plt.colorbar(label="Magnitude [dB]")  # Colorbar for intensity scale
        
    return td_rms, fd_rms, sxx_db

def average_filter(signal, window_size):
    """
    Applies an average filter to downsample the signal.
    
    Parameters:
    - signal (1D array): The input signal
    - window_size (int): Number of samples to average per output sample
    
    Returns:
    - downsampled_signal (1D array): The smoothed, downsampled signal
    """
    num_samples = len(signal) // window_size  # Determine new length
    return np.mean(signal[:num_samples * window_size].reshape(-1, window_size), axis=1)

def medfilt_vertcal_norm(spec,vertical_medfilt_size):

    #med filt over hver kolonne
    sxx_med = np.zeros_like(spec)
    for i in range(spec.shape[1]):
        sxx_med[:,i] = signal.medfilt(spec[:,i],kernel_size=vertical_medfilt_size)

    #Normaliserer sxx
    epsilon = np.min(sxx_med[sxx_med > 0]) if np.any(sxx_med > 0) else np.finfo(float).eps
    sxx_norm = spec/np.maximum(sxx_med, epsilon)

    return sxx_norm
    

def spec_hfilt2(spec, freq, time, window_length: float):
    """
    Compute a spectrogram and smooth it along the time axis by averaging within time segments.
    Applies a horizontal filter to any 2D array. 
    This filter takes an average of [window_length] seconds worth of data and reduces the data to one value.

    Parameters:
        audio_file (str): Path to the audio file.
        window_length (float): Length of the averaging window in seconds.

    Returns:
        smoothed_spec: Time-smoothed spectrogram.
        freq: Frequency bins.
        new_time: New time bins (after averaging).
    """

    # Convert window length from seconds to number of time bins
    dt = time[1] - time[0]  # Time step between spectrogram columns
    segment_size = max(1, int(window_length / dt))  # Ensure at least 1

    # Compute number of segments
    num_segments = spec.shape[1] // segment_size
    
    # Trim excess columns & reshape into segments
    smoothed_spec = spec[:, :num_segments * segment_size]
    smoothed_spec = smoothed_spec.reshape(spec.shape[0], num_segments, segment_size)
    smoothed_spec = smoothed_spec.mean(axis=2)  # Average along time segments


    # Compute new time bins as the average of each segment
    new_time = time[:num_segments * segment_size].reshape(num_segments, segment_size).mean(axis=1)

    return smoothed_spec, freq, new_time

def NB_detect(spec,Threshold):
    return True in (spec > Threshold)

 
# The Smoothed Coherence Transform (SCOT)
# Code is simplfied from https://github.com/SiggiGue/gccestimating
def scot(signal_1, signal_2):
    lenght = len(signal_1) + len(signal_2) -1
    fftlen = int(2**np.ceil(np.log2(lenght)))

    # Spectrum of inputsignal
    spectrum_1 = np.fft.rfft(signal_1, fftlen)
    spectrum_2 = np.fft.rfft(signal_2, fftlen)

    # Auto power spectrum
    G_11 = np.real(spectrum_1*np.conj(spectrum_1))
    G_22 = np.real(spectrum_2*np.conj(spectrum_2))

    # cross power spectrum
    G_12 = spectrum_1*np.conj(spectrum_2)

    # 
    denominator = np.sqrt(G_11*G_22)

    # To prevent devision by zero
    denominator[np.logical_and(denominator < 1e-12, denominator > -1e-12)] = 1e12

    # coherence function
    gamma = G_12 / denominator

    # inverse fft of gamma
    line = np.fft.irfft(gamma, fftlen)
    line = np.roll(line, len(line)//2)
    start = (len(line)-lenght)//2 + 1
    
    return line[start:start+lenght]
