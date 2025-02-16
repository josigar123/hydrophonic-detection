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

def Hilbert_DS(input_file, Fs:int ,medfilt_window: int):
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

    #median filter
    h_filt = signal.medfilt(h_2,medfilt_window)

    #Downsampling
    DS_Sx = resample_poly(h_filt,1,medfilt_window)
    DS_Fs = Fs/medfilt_window
    DS_t = np.linspace(0,(len(DS_Sx)/DS_Fs),len(DS_Sx))


    return DS_Sx, DS_Fs, DS_t

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
    noice_t_start = int(noice_t_start*DS_Fs) # converting form seconds to samples
   
    noice_t_stop = int(noice_t_start+(window_size*DS_Fs))
    noice = np.mean(DS_Sx[noice_t_start:noice_t_stop])
    print(f"noice = {10*np.log10(noice)}")

    kernel_size = int(window_size*DS_Fs)+int(int(window_size*DS_Fs) % 2 == 0)
    signal_med = signal.medfilt(DS_Sx,kernel_size)
    signal_vals = 10*np.log10(signal_med/noice) - trigger

    try:
        indices = np.where(signal_vals > 0)[0]
        Trigger_time = indices/DS_Fs
    except:
        Trigger_time = 0
        print("Warning: Trigger is too high")
        print("No trigger time registerd")

    if plot ==True:
        BBnorm_t = np.linspace(0,(len(signal_vals)/DS_Fs),len(signal_vals))

        plt.figure(figsize=(12,6))

        plt.plot(BBnorm_t,signal_vals + trigger)
        plt.axhline(y=trigger, color='red', linestyle='--', label="Trigger")
        plt.axvline(x=noice_t_start/DS_Fs, color='red', linestyle='--')
        plt.title("BBnorm")
        plt.xlabel("Time [s]")
        plt.ylabel("Amplitude [dB]")
        plt.show()
    
    return Trigger_time

def BroadBand_from_file(input_file, Fds:int ,medfilt_window: int, trigger:int, plot:bool):

    # Load audio data from the input file
    data_org, sr = librosa.load(input_file)  # Load the file, returns the audio signal and its sampling rate

    # Adjust window size based on audio length
    window_size = int((len(data_org) / sr) * 0.01)  # Window size as a fraction of the total signal length

    # Downsample the original audio data to the desired sampling frequency
    data_offcet = resample_poly(data_org, 1, int(sr / Fds))  # Resampling the signal to Fds

    # Remove DC offset by subtracting the mean value
    data = data_offcet - np.mean(data_offcet)  # Remove the mean (DC offset)

    # Apply Hilbert transform to the signal, take the absolute value, square the result (power envelope), and then apply a median filter
    # to smooth the squared analytic signal. The window size for the median filter is defined by `medfilt_window`.
    envelope = signal.medfilt(np.square(np.abs(hilbert(data))),medfilt_window)

    # Downsample the filtered signal
    DS_Sx = resample_poly(envelope, 1, medfilt_window)  # Resample by the median filter window size
    DS_Fs = Fds / medfilt_window  # New sampling rate after downsampling
    #DS_t = np.linspace(0, (len(DS_Sx) / DS_Fs), len(DS_Sx))  # Time vector for the downsampled signal

    # Define kernel size for the median filter based on window size
    kernel_size = int(window_size * DS_Fs) | 1  # Ensure odd size
    signal_med = signal.medfilt(DS_Sx, kernel_size)  # Apply median filter for further noise removal

    # Auto noise detection: Identify long segments of similar values
    signal_med2 = signal_med[kernel_size:-kernel_size]  # Remove edges affected by filter size

    # Step 1: Identify consecutive regions with the same value (groups)
    indices = np.arange(len(signal_med2))  # Create an array of indices
    groups = np.split(indices, np.where(np.diff(signal_med2) != 0)[0] + 1)  # Split into groups of similar values

    # Step 2: Compute the average amplitude for each group
    group_averages = np.array([np.mean(signal_med2[g]) for g in groups])

    # Step 3: Define a threshold based on the lowest average amplitude
    min_avg = np.min(group_averages)  # Minimum group average
    threshold = min_avg * 1.5  # Threshold to allow some variation

    # Step 4: Find the longest group that is below the threshold
    valid_groups = [g for g, avg in zip(groups, group_averages) if avg <= threshold]
    longest_group = max(valid_groups, key=len) if valid_groups else None  # Longest valid group

    if longest_group is None or len(longest_group) == 0:
        middle_index = None  # No valid group found

    # Step 5: Determine the middle index of the longest group
    middle_index = kernel_size + longest_group[len(longest_group) // 2]
    # Calculate the noise start and stop indices based on the middle of the group
    nosie_start = int(middle_index - (window_size * DS_Fs // 2))
    nosie_stop = int(middle_index + (window_size * DS_Fs // 2))
    nosie = np.mean(signal_med[nosie_start:nosie_stop])  # Calculate the noise level
    print(f"nosie = {10 * np.log10(nosie)}")  # Print the noise level in dB

    # Normalize the signal by the noise level and subtract the trigger threshold
    signal_vals = 10 * np.log10(signal_med / nosie) - trigger

    # Try to detect trigger times based on the normalized signal
    try:
        # Indices where the signal exceeds threshold
        indices = np.where((signal_vals[:-1] <= 0) & (signal_vals[1:] > 0))[0]
        Trigger_time = indices / DS_Fs  # Convert indices to time
    except:
        Trigger_time = None  # Set to None if no triggers are found
        print("Warning: Trigger is too high")  # Inform the user if no trigger time is registered
        print("No trigger time registered")

    # If plotting is enabled, plot the results
    if plot == True:
        BBnorm_t = np.linspace(0, (len(signal_vals) / DS_Fs), len(signal_vals))  # Time vector for the normalized signal

        plt.figure(figsize=(12, 6))  # Set up the figure for plotting
        plt.plot(BBnorm_t, signal_vals + trigger)  # Plot the normalized signal
        plt.axhline(y=trigger, color='red', linestyle='--', label="Trigger")  # Plot the trigger threshold
        #plt.axvline(x=nosie_start / DS_Fs, color='red', linestyle='--')  # Mark the start of the noise window
        #plt.axvline(x=nosie_stop / DS_Fs, color='red', linestyle='--')  # Mark the end of the noise window
        plt.title("BBnorm")  # Title of the plot
        plt.xlabel("Time [s]")  # X-axis label
        plt.ylabel("Amplitude [dB]")  # Y-axis label
        plt.show()  # Show the plot

    return Trigger_time

def BroadBand_from_data(Sx, Fs:int ,medfilt_window: int, trigger:int, plot:bool):

    # Adjust window size based on audio length
    window_size = int((len(Sx) / Fs) * 0.01)  # Window size as a fraction of the total signal length

    # Apply Hilbert transform to the signal, take the absolute value, square the result (power envelope), and then apply a median filter
    # to smooth the squared analytic signal. The window size for the median filter is defined by `medfilt_window`.
    envelope = signal.medfilt(np.square(np.abs(hilbert(Sx))),medfilt_window)

    # Downsample the filtered signal
    DS_Sx = resample_poly(envelope, 1, medfilt_window)  # Resample by the median filter window size
    DS_Fs = Fs / medfilt_window  # New sampling rate after downsampling
    #DS_t = np.linspace(0, (len(DS_Sx) / DS_Fs), len(DS_Sx))  # Time vector for the downsampled signal

    # Define kernel size for the median filter based on window size
    kernel_size = int(window_size * DS_Fs) | 1  # Ensure odd size
    signal_med = signal.medfilt(DS_Sx, kernel_size)  # Apply median filter for further noise removal

    # Auto noise detection: Identify long segments of similar values
    signal_med2 = signal_med[kernel_size:-kernel_size]  # Remove edges affected by filter size

    # Step 1: Identify consecutive regions with the same value (groups)
    indices = np.arange(len(signal_med2))  # Create an array of indices
    groups = np.split(indices, np.where(np.diff(signal_med2) != 0)[0] + 1)  # Split into groups of similar values

    # Step 2: Compute the average amplitude for each group
    group_averages = np.array([np.mean(signal_med2[g]) for g in groups])

    # Step 3: Define a threshold based on the lowest average amplitude
    min_avg = np.min(group_averages)  # Minimum group average
    threshold = min_avg * 1.5  # Threshold to allow some variation

    # Step 4: Find the longest group that is below the threshold
    valid_groups = [g for g, avg in zip(groups, group_averages) if avg <= threshold]
    longest_group = max(valid_groups, key=len) if valid_groups else None  # Longest valid group

    if longest_group is None or len(longest_group) == 0:
        middle_index = None  # No valid group found

    # Step 5: Determine the middle index of the longest group
    middle_index = kernel_size + longest_group[len(longest_group) // 2]
    # Calculate the noise start and stop indices based on the middle of the group
    nosie_start = int(middle_index - (window_size * DS_Fs // 2))
    nosie_stop = int(middle_index + (window_size * DS_Fs // 2))
    nosie = np.mean(signal_med[nosie_start:nosie_stop])  # Calculate the noise level
    print(f"nosie = {10 * np.log10(nosie)}")  # Print the noise level in dB

    # Normalize the signal by the noise level and subtract the trigger threshold
    signal_vals = 10 * np.log10(signal_med / nosie) - trigger

    # Try to detect trigger times based on the normalized signal
    try:
        # Indices where the signal exceeds threshold
        indices = np.where((signal_vals[:-1] <= 0) & (signal_vals[1:] > 0))[0]
        Trigger_time = indices / DS_Fs  # Convert indices to time
    except:
        Trigger_time = None  # Set to None if no triggers are found
        print("Warning: Trigger is too high")  # Inform the user if no trigger time is registered
        print("No trigger time registered")

    # If plotting is enabled, plot the results
    if plot == True:
        BBnorm_t = np.linspace(0, (len(signal_vals) / DS_Fs), len(signal_vals))  # Time vector for the normalized signal

        plt.figure(figsize=(12, 6))  # Set up the figure for plotting
        plt.plot(BBnorm_t, signal_vals + trigger)  # Plot the normalized signal
        plt.axhline(y=trigger, color='red', linestyle='--', label="Trigger")  # Plot the trigger threshold
        #plt.axvline(x=nosie_start / DS_Fs, color='red', linestyle='--')  # Mark the start of the noise window
        #plt.axvline(x=nosie_stop / DS_Fs, color='red', linestyle='--')  # Mark the end of the noise window
        plt.title("BBnorm")  # Title of the plot
        plt.xlabel("Time [s]")  # X-axis label
        plt.ylabel("Amplitude [dB]")  # Y-axis label
        plt.show()  # Show the plot
    return Trigger_time

def DEMON_from_file(input_file, Fs, Fds,freq_filt ,fmax=100, s_max=10):
    #DEMON 2
    import numpy as np
    import matplotlib.pyplot as plt
    from scipy.signal import resample_poly, butter, hilbert
    import librosa
    import scipy.signal as signal

    #input_file = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/Wav_files/41.wav"

    #Sampling org data
    data_org, sr = librosa.load(input_file)

    #Downsample to Fs
    DS_org = resample_poly(data_org,1,int(sr/Fs))
    b,a = signal.butter(N=4,Wn=100, btype="highpass",fs=Fs)
    HPF = signal.filtfilt(b,a,DS_org)

    #removing dc_offcet
    data = HPF - np.mean(HPF)

    #RMS data of hilbert
    medfilt_window = Fds #Number of samples in time axis of original audio to smooth
    kernal_size = medfilt_window + (medfilt_window%2 == 0)
    analytic_signal = np.abs(hilbert(data))**2
    h_filt = signal.medfilt(analytic_signal,kernal_size)
    #Downsampled so that each new sample is a mean of h_filt samples
    rms_values  = np.sqrt(resample_poly(h_filt,1,int(Fs/kernal_size)))

    #hente freq
    nperseg= kernal_size*3 #Number of samples in time axis to use for each vertical spectrogram coloumn

    fd_rms, td_rms, sxx_rms = signal.spectrogram(rms_values,kernal_size,
                                                    nperseg=nperseg,
                                                    noverlap=5*nperseg//6,
                                                    #nfft=int(200*kernal_size / nperseg),
                                                    window="hamming"
                                                    )


    #med filt over hver kolonne
    vertical_medfilt_size  = freq_filt
    sxx_rms_med = np.zeros_like(sxx_rms)
    for i in range(sxx_rms.shape[1]):
        sxx_rms_med[:,i] = signal.medfilt(sxx_rms[:,i],kernel_size=vertical_medfilt_size)

    #Normaliserer sxx

    sxx_rms_norm = sxx_rms/sxx_rms_med
    plt.figure(figsize=(9,9))
    plt.subplot(1, 1, 1)

    plt.pcolormesh(td_rms, fd_rms, 10*np.log10(sxx_rms_norm), vmin=0,vmax=s_max)
    plt.xlabel("Time [s]")
    plt.ylabel("Demon Frequency [Hz]")
    plt.ylim(0,fmax)
    plt.title("sxx_rms_norm")
    plt.colorbar(label="Magnitude [dB]")  # Colorbar for intensity scale
    return 0

def DEMON_from_data(DS_Sx, DS_Fs, Fds,freq_filt ,fmax=100, s_max=10, window="hamming"):
    #WIP
    import numpy as np
    import matplotlib.pyplot as plt
    from scipy.signal import resample_poly, butter, hilbert
    import librosa
    import scipy.signal as signal

    #input_file = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/Wav_files/41.wav"
    """
    #Sampling org data
    data_org, sr = librosa.load(input_file)

    #Downsample to Fs
    DS_org = resample_poly(data_org,1,int(sr/Fs))
    b,a = signal.butter(N=4,Wn=100, btype="highpass",fs=Fs)
    HPF = signal.filtfilt(b,a,DS_org)

    #removing dc_offcet
    data = HPF - np.mean(HPF)
    
    #RMS data of hilbert
    medfilt_window = Fds #DEMON downsample frequency
    kernal_size = medfilt_window + (medfilt_window%2 == 0)
    analytic_signal = np.abs(hilbert(DS_Sx))**2
    h_filt = signal.medfilt(analytic_signal,kernal_size)
    """
    #Downsampled so that each new sample is a mean of h_filt samples
    #rms_values  = np.sqrt(resample_poly(DS_Sx,1,int(DS_Fs/Fds)))
    
    

    nperseg= int(DS_Fs*3) #Number of samples in time axis to use for each vertical spectrogram coloumn

    fd_rms, td_rms, sxx_rms = signal.spectrogram(DS_Sx,DS_Fs,
                                                    nperseg=nperseg,
                                                    noverlap=5*nperseg//6,
                                                    #nfft=int(200*kernal_size / nperseg),
                                                    window = window
                                                    )


    #med filt over hver kolonne
    vertical_medfilt_size  = freq_filt
    sxx_rms_med = np.zeros_like(sxx_rms)
    for i in range(sxx_rms.shape[1]):
        sxx_rms_med[:,i] = signal.medfilt(sxx_rms[:,i],kernel_size=vertical_medfilt_size)

    #Normaliserer sxx

    sxx_rms_norm = sxx_rms/sxx_rms_med
    plt.figure(figsize=(9,9))
    plt.subplot(1, 1, 1)

    plt.pcolormesh(td_rms, fd_rms, 10*np.log10(sxx_rms_norm), vmin=0,vmax=s_max)
    plt.xlabel("Time [s]")
    plt.ylabel("Demon Frequency [Hz]")
    plt.ylim(0,fmax)
    plt.title("sxx_rms_norm")
    plt.colorbar(label="Magnitude [dB]")  # Colorbar for intensity scale
    return 0