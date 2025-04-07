#Old function library
#This library contains functions that are not used in the bachelor project

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
    sx = np.square(np.abs(sx))
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

def locate_low_amp(sx,kernel_size):
    # Auto noise detection: Identify long segments of similar values
    sx2 = sx[kernel_size:-kernel_size]  # Remove edges affected by filter size

    # Step 1: Identify consecutive regions with the same value (groups)
    indices = np.arange(len(sx2))  # Create an array of indices
    groups = np.split(indices, np.where(np.diff(sx2) != 0)[0] + 1)  # Split into groups of similar values

    # Step 2: Compute the average amplitude for each group
    group_averages = np.array([np.mean(sx2[g]) for g in groups])

    # Step 3: Define a threshold based on the lowest average amplitude
    min_avg = np.min(group_averages)  # Minimum group average
    threshold = min_avg * 1.5  # Threshold to allow some variation, 1.5 eq to +- 50%

    # Step 4: Find the longest group that is below the threshold
    valid_groups = [g for g, avg in zip(groups, group_averages) if avg <= threshold]
    longest_group = max(valid_groups, key=len) if valid_groups else None  # Longest valid group

    if longest_group is None or len(longest_group) == 0:
        middle_index = None  # No valid group found

    # Step 5: Determine the middle index of the longest group
    middle_index = kernel_size + longest_group[len(longest_group) // 2]

    # Calculate the noise start and stop indices based on the middle of the group
    noise_start = int(middle_index - (kernel_size // 2))
    noise_stop = int(middle_index + (kernel_size // 2))
    noise = np.mean(sx[noise_start:noise_stop])  # Calculate the noise level
    return noise

def replace_zeros_with_next_lowest(signal_vals):
    """
    Replaces all zeros in signal_vals with the next lowest value in the array efficiently.
    
    Parameters:
        signal_vals (np.ndarray): 1D NumPy array containing the signal values.
        
    Returns:
        np.ndarray: Modified array where zeros are replaced.
    """
    # Ensure we are working with a copy (avoid modifying original)
    modified = np.copy(signal_vals)

    # Find all zero indices
    zero_mask = (modified == 0)
    
    if not np.any(zero_mask):  
        return modified  # If no zeros, return early for efficiency

    # Replace zeros with the previous nonzero value
    modified[zero_mask] = np.nan  # Mark zeros as NaN
    modified = np.maximum.accumulate(np.nan_to_num(modified, nan=np.nanmin(modified) - 1))

    return modified

def BroadBand_from_file(input_file, Fs:int ,hilbert_win: int, window_size:float, trigger:float, plot:bool):

    data, Fs = load_audiofile(input_file,Fs,True) #Load the audiofile as well as remove DC-offcet

    # Apply Hilbert transform to the signal, take the absolute value, square the result (power envelope), and then apply a median filter
    # to smooth the squared analytic signal. The window size for the median filter is defined by `medfilt_window`.
    envelope = signal.medfilt(np.square(np.abs(hilbert(data))),hilbert_win)

    # Downsample the filtered signal
    DS_Sx = resample_poly(envelope, 1, hilbert_win)  # Resample by the median filter window size
    DS_Fs = Fs / hilbert_win  # New sampling rate after downsampling

    # Define kernel size for the median filter based on window size
    kernel_size = int(window_size * DS_Fs) | 1  # Ensure odd size
    signal_med = signal.medfilt(DS_Sx, kernel_size)  # Apply median filter for further noise removal

    noise = locate_low_amp(signal_med, kernel_size) #Determine the noise form the signal

    # Normalize the signal by the noise level and subtract the trigger threshold
    norm_vals = np.maximum(signal_med/noise,0.1)
    signal_vals = 10 * np.log10(norm_vals) - trigger
    signal_vals = moving_average_padded(signal_vals, kernel_size)

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

        plt.figure(figsize=(16, 4))  # Set up the figure for plotting
        plt.plot(BBnorm_t, signal_vals + trigger)  # Plot the normalized signal
        plt.axhline(y=trigger, color='red', linestyle='--', label="Trigger")  # Plot the trigger threshold
        plt.title("BBnorm")  # Title of the plot
        plt.xlabel("Time [s]")  # X-axis label
        plt.ylabel("Amplitude [dB]")  # Y-axis label
        plt.show()  # Show the plot
    return Trigger_time

def BroadBand_from_data(Sx, Fs:int ,hilbert_win: int, window_size:float ,trigger:float, plot:bool):

    # Apply Hilbert transform to the signal, take the absolute value, square the result (power envelope), and then apply a median filter
    # to smooth the squared analytic signal. The window size for the median filter is defined by `medfilt_window`.
    envelope = signal.medfilt(np.square(np.abs(hilbert(Sx))),hilbert_win)

        # Downsample the filtered signal
    DS_Sx = resample_poly(envelope, 1, hilbert_win)  # Resample by the median filter window size
    DS_Fs = Fs / hilbert_win  # New sampling rate after downsampling

    # Define kernel size for the median filter based on window size
    kernel_size = int(window_size * DS_Fs) | 1  # Ensure odd size
    signal_med = signal.medfilt(DS_Sx, kernel_size)  # Apply median filter for further noise removal

    noise = locate_low_amp(signal_med, kernel_size) #Determine the noise form the signal

    # Normalize the signal by the noise level and subtract the trigger threshold
    norm_vals = np.maximum(signal_med/noise,0.1)
    signal_vals = 10 * np.log10(norm_vals) - trigger

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

        plt.figure(figsize=(16, 4))  # Set up the figure for plotting
        plt.plot(BBnorm_t, signal_vals + trigger)  # Plot the normalized signal
        plt.axhline(y=trigger, color='red', linestyle='--', label="Trigger")  # Plot the trigger threshold
        plt.title("BBnorm")  # Title of the plot
        plt.xlabel("Time [s]")  # X-axis label
        plt.ylabel("Amplitude [dB]")  # Y-axis label
        plt.show()  # Show the plot
    return Trigger_time

def BB_data_old(Sx, Fs, hilbert_win, window_size):
    """
    PARAMETERS:
        sx: array of float
            Audio signal in time domain
        fs: int
            samplerate of sx
        hilbert_win: int
            No. of samples used for downsamlpling
        window_size: float
            No. of seconds used for filtering

    RETURN:
        BB_sig: array of float
            Logarithmic representation of power-envelope
        t: array of float
            time array corresponding to BB_sig
    """
    # Apply Hilbert transform to the signal, take the absolute value, square the result (power envelope), and then apply a median filter
    # to smooth the squared analytic signal. The window size for the median filter is defined by `medfilt_window`.
    envelope = moving_average_padded(np.square(np.abs(hilbert(Sx))),hilbert_win)

        # Downsample the filtered signal
    DS_Sx = resample_poly(envelope, 1, hilbert_win)  # Resample by the median filter window size
    DS_Fs = Fs / hilbert_win  # New sampling rate after downsampling

    # Define kernel size for the median filter based on window size
    kernel_size = int(window_size * DS_Fs) | 1  # Ensure odd size
    signal_med = moving_average_padded(DS_Sx, kernel_size)  # Apply median filter for further noise removal

    BB_sig = 10*np.log10(signal_med)
    t = np.linspace(0,len(BB_sig)/DS_Fs,len(BB_sig))
    return BB_sig, t

def DEMON_from_file(input_file, Fs, Fds,freq_filt ,fmax=100, s_max=10, window="hamming"):

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
                                                    window=window
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