#Function library for data processing
#Bachelor i havnovervåkning vha hydrofon
#Christoffer Aaseth
#Last updated: 25.05.2025


import matplotlib.pyplot as plt
from scipy import signal
from scipy.io import wavfile
from scipy.fft import fft, fftshift, fftfreq    # FFT and helper functions
import numpy as np
from scipy.signal import hilbert, resample_poly
import librosa
import matplotlib.gridspec as gridspec

def plot_spectrogram(x, fs, tperseg, freq_filt, hfilt_length, f_max = 1000, s_min=0,s_max=10, plot=True):
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

def plot_spectrogram_multichannel(x, fs, tperseg, freq_filt, hfilt_length, f_max = 1000, s_min=0,s_max=10,window="hamming", plot=True):
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
    sum_spec = 0
    for channel in x:
        # Calculate spectrogram
        nperseg=int(tperseg*fs)
        f, t, sx = signal.spectrogram(channel, fs, nperseg=nperseg, window=window,detrend=False)
        sx_norm = medfilt_vertcal_norm(sx,freq_filt)
        sum_spec += sx_norm
    sx_db = 10*np.log10(np.maximum(sum_spec,1e-10))   # Convert to dB
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
    if output_path != None:
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

def load_audiofile(input_file, fs:int, fc_low:float ,remove_offcet=True, mono=True):
    """
    INPUT:
        input_file: directory to audiofile
        Fds: Frequency to sample audiofilfe
    RETUN:
        sx : discreete audio data
        fs : sample frequency
    """
    # Load audio data from the input file
    data_arr, fs = librosa.load(input_file, sr=fs, mono=mono)  # Load the file, returns the audio signal and its sampling rate

    b,a = signal.butter(N=4,Wn=fc_low, btype="highpass",fs=fs)
    if not mono:
        for i in range(len(data_arr)):
            data_arr[i] = signal.filtfilt(b,a,data_arr[i])   

            if remove_offcet:
                # Remove DC offset by subtracting the mean value
                data_arr[i] = data_arr[i] - np.mean(data_arr[i])  # Remove the mean (DC offset)

    else:
        data_arr = signal.filtfilt(b,a,data_arr)   
        if remove_offcet:
            # Remove DC offset by subtracting the mean value
            data_arr = data_arr - np.mean(data_arr)  # Remove the mean (DC offset)
                
    
    return data_arr, fs

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

    #RMS data of hilbert NB! Not acually RMS - more like MS (mean of squares)
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
    fc = 0 #Hz
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

def DEMON_multichannel(sx, fs, fds, tperseg, freq_filt, hfilt_length ,fmax=100, s_max=10, window="hamming", plot=True):
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
    sum_spec = 0
    kernal_size = int(fs/fds) 

    for channel in sx:

        #RMS data of hilbert NB! Not acually RMS - more like MS (mean of squares)
        analytic_signal = np.abs(hilbert(channel))**2
        rms_values = average_filter(analytic_signal, kernal_size)
        
        #hente freq
        nperseg= int(fds*tperseg) #Number of samples in time axis to use for each vertical spectrogram coloumn

        fd_rms, td_rms, sxx_rms = signal.spectrogram(rms_values,fds,
                                                        nperseg=nperseg,
                                                        window=window
                                                        )


        #Normaliserer sxx
        sxx_rms_norm = medfilt_vertcal_norm(spec=sxx_rms,vertical_medfilt_size=freq_filt)
        sum_spec += sxx_rms_norm

    sxx_db, fd_rms, td_rms = spec_hfilt2(10*np.log10(sum_spec),fd_rms,td_rms,window_length=hfilt_length)

    #bandpass cut filter
    fc = 3 #Hz
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
def scot(signal_1, signal_2, fs):
    """
    INPUT:
        signal_1, signal_2 : array of float
            Audio data in time domain. (Best 512 samples)
        fs: int
            Samplerate of audio signal
    
    OUTPUT:
        graph_line: array of float
            Line segment of correlation graph
        corr_lags_t: array of float
            y-axis values, correlation time shift
    """
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
    
    graph_line = line[start:start+lenght]
    corr_lags_t = signal.correlation_lags(len(signal_1),len(signal_2))/fs

    return graph_line, corr_lags_t

def full_plot_imag(input_file, pars:dict, caption:str):
    """
    Makes an image with the sudiosignal, broadband analasys w/trigger, spectrogram and DEMON spectrogram.
    INPUT:
        Input_file: any format compatible with librosa.load(), must be recorded with multiple channels
        pars: dict
            dictionary with all processing parameters
        caption: str
            Caption of image, f"Results from {caption}"
    """


    sx, fs = load_audiofile(input_file, pars["fs"], 5, True, False)


    D_td, D_fd, D_sx = DEMON_multichannel(sx, fs=pars["fs"], fds=pars["DEMON"]["fds"], tperseg=pars["DEMON"]["tperseg"], freq_filt=pars["DEMON"]["freq_filt"], hfilt_length=pars["DEMON"]["hfilt_length"],window=pars["DEMON"]["window"], plot = False)

    S_td, S_fd, S_sx = plot_spectrogram_multichannel(sx, pars["fs"], tperseg=pars["spectrogram"]["tperseg"], freq_filt=pars["spectrogram"]["freq_filt"], hfilt_length=pars["spectrogram"]["hfilt_length"],window=pars["spectrogram"]["window"],plot=False)
    bb_sx = 0
    for i in range(len(sx)):
        bb_sx += sx[i]

    bb, bbt, bb_buff_out = BB_data(bb_sx,fs=pars["fs"],sx_buff=[],hilbert_win=pars["broadband"]["hilbert_win"], window_size=pars["broadband"]["window_size"])
    bb = bb-bb.min()

    vmin = 10*np.log10(len(sx))
    

    fontsize=14

    fig = plt.figure(figsize=(16, 16))

    # 7 rader, 4 kolonner – styr høyde proporsjonalt
    gs = gridspec.GridSpec(7, 4, height_ratios=[4, 0.01, 4, 0.01, 4.2, 4.2, 0.01], hspace=0.7)

    # A: rad 0, hele bredden
    axA = fig.add_subplot(gs[0, :])
    axA.set_title("Audio signal", fontsize=fontsize+2)
    axA.plot(np.linspace(0, len(sx[0]) / fs, len(sx[0])), bb_sx / len(sx))
    axA.set_ylabel("Amplitude", fontsize=fontsize)
    axA.set_xlabel("Tid [s]", fontsize=fontsize)
    axA.set_yticks([-1,-0.5,0,0.5,1])
    axA.grid()

    # B: rad 2, hele bredden
    T_1 = pars["broadband"]["trigger"]

    # Finn steder hvor verdien går fra under T til over T
    overskridninger_1 = (bb[:-1] < T_1) & (bb[1:] > T_1)

    # Hent indeksene rett etter terskelkryssing
    indekser_1 = np.where(overskridninger_1)[0] + 1
    times_1 = indekser_1*50/fs


    axB = fig.add_subplot(gs[2, :])
    axB.set_title("Broadbandsignal for detection", fontsize=fontsize+2)
    axB.plot(bbt, bb, linewidth=2)
    axB.set_ylabel("SNR [dB]", fontsize=fontsize)
    axB.set_xlabel("Tid [s]", fontsize=fontsize)
  
    axB.hlines(y=[T_1],xmin=0,xmax=(len(sx[0]) / fs),colors='r',linestyles='--')
    axB.vlines(x=[times_1],ymin=-1,ymax=T_1, linestyles='--', colors='black')
    for i in range(len(times_1)):
        axB.plot(times_1[i], T_1, 'o', markersize=12, markeredgecolor='magenta', markerfacecolor='none')
        axB.text(times_1[i], -5, f'{int(times_1[i]//60)}m{int(times_1[i]%60)}s', color='black', rotation=30,
            ha='center', va='bottom', fontsize=9)

    axB.text(0, T_1+1, fr'$T={T_1}$', fontsize=12)
    axB.grid()

    # C: nederst venstre, rad 4-5 (2 rader), kolonne 0-1
    axC = fig.add_subplot(gs[4:6, 0:2])
    axC.set_title("Spectrogram", fontsize=fontsize+2)

    vmin_spec = pars["spectrogram"]["vmin"] if pars["spectrogram"]["vmin"] is not None else 10 * np.log10(len(sx))
    maxfreq_spec = pars["spectrogram"]["maxfreq"] if pars["spectrogram"]["maxfreq"] is not None else pars["fs"]/2

    pcmC = axC.pcolormesh(S_td, S_fd, S_sx, vmin=vmin_spec, vmax=pars["spectrogram"]["vmax"], cmap='inferno')
    axC.set_ylim(pars["spectrogram"]["minfreq"],maxfreq_spec)
    plt.colorbar(pcmC, ax=axC,label="SNR [dB]")
    axC.set_xlabel("Tid [s]", fontsize=fontsize)
    axC.set_ylabel("Frequency [Hz]", fontsize=fontsize-1)
    axC.vlines(x=[times_1],ymin=pars["spectrogram"]["minfreq"]-150,ymax=maxfreq_spec, linestyles='--', colors='red')
    for i in range(len(times_1)):
        axC.text(times_1[i], pars["spectrogram"]["minfreq"]-150, f'{int(times_1[i]//60)}m{int(times_1[i]%60)}s', color='black', rotation=30,
                ha='center', va='bottom', fontsize=9)

    # D: nederst høyre, rad 4-5 (2 rader), kolonne 2-3
    axD = fig.add_subplot(gs[4:6, 2:4])
    axD.set_title("DEMON spectrogram", fontsize=fontsize+2)

    vmin_dem = pars["DEMON"]["vmin"] if pars["DEMON"]["vmin"] is not None else 10 * np.log10(len(sx))
    maxfreq_dem = pars["DEMON"]["maxfreq"] if pars["DEMON"]["maxfreq"] is not None else pars["fs"]/2

    pcmD = axD.pcolormesh(D_td, D_fd, D_sx, vmin=vmin_dem, vmax=pars["DEMON"]["vmax"])
    axD.set_ylim(pars["DEMON"]["minfreq"], maxfreq_dem)
    plt.colorbar(pcmD, ax=axD,label="SNR [dB]")
    axD.set_xlabel("Tid [s]", fontsize=fontsize)
    axD.set_ylabel("Frequency [Hz]", fontsize=fontsize-1)

    for ax in [axA, axB, axC, axD]:
        ax.tick_params(axis='both', labelsize=14)

    fig.suptitle(f"Results from {caption}", fontsize=fontsize+3, fontweight='bold')
    plt.tight_layout(rect=[0, 0, 1, 0.98])

    return 0