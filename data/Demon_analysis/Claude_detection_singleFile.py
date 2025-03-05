import numpy as np
from scipy import signal
from scipy.fft import fft
from scipy.signal import hilbert
import os
from pathlib import Path
from scipy.io import wavfile
import matplotlib.pyplot as plt

def broad_band_analysis(mixseg, noise, fs, pars):
    """
    Analyze audio data in different frequency bands
    
    Args:
        mixseg: Audio segment to analyze
        noise: Noise segment for comparison
        fs: Sampling frequency
        pars: Parameters dictionary
    
    Returns:
        BBsignal: Array of broadband analysis results
    """
    BBsignal = np.zeros(len(pars['broadband']['FrequencyWindow']))
    
    for j in range(len(pars['broadband']['FrequencyWindow'])):
        # Design the filter
        nyq = fs / 2
        low = pars['broadband']['FrequencyWindow'][j][0] / nyq
        high = pars['broadband']['FrequencyWindow'][j][1] / nyq
        b, a = signal.butter(pars['broadband']['order'], [low, high], btype='band')
        
        # Apply the filter
        filtered_audio = signal.filtfilt(b, a, mixseg)
        filtered_noise = signal.filtfilt(b, a, noise)
        
        # Remove inf and nan values
        filtered_audio = filtered_audio[~np.isinf(filtered_audio)]
        filtered_audio = filtered_audio[~np.isnan(filtered_audio)]
        filtered_noise = filtered_noise[~np.isinf(filtered_noise)]
        filtered_noise = filtered_noise[~np.isnan(filtered_noise)]
        
        # Calculate BBsignal
        BBsignal[j] = 10 * np.log10(np.sum(np.abs(filtered_audio)**2) / 
                                   np.sum(np.abs(filtered_noise)**2))
    
    return BBsignal

def demon_analysis(audio_data, fs, pars):
    """
    Perform DEMON (Detection of Envelope Modulation on Noise) analysis
    
    Args:
        audio_data: Input audio data
        fs: Sampling frequency
        pars: Parameters dictionary
    
    Returns:
        sd: Spectrogram data
        f: Frequency values
        t: Time values
    """
    # Bandpass filter
    nyq = fs / 2
    low = pars['DEMON']['bandpass']['f_low'] / nyq
    b, a = signal.butter(pars['DEMON']['bandpass']['order'], [low, 0.99], btype='band')
    filtered_audio = signal.filtfilt(b, a, audio_data)
    
    # Define window length
    d = round(1/pars['DEMON']['fsd'] * fs)
    fsd1 = fs/d
    print(f"d = {d}, fsd1 = {fsd1} fs={fs}")
    # Calculate number of windows
    num_windows = int(np.floor(len(filtered_audio) / d))
    
    # Initialize RMS values array
    rms_values = np.zeros(num_windows)
    
    # Calculate RMS values for each window
    for i in range(num_windows):
        start_idx = i * d
        end_idx = min((i + 1) * d, len(filtered_audio))
        window_data = filtered_audio[start_idx:end_idx]
        
        # Calculate envelope using Hilbert transform
        hilbert_data = hilbert(window_data)
        rms_values[i] = np.sqrt(np.mean(np.abs(hilbert_data)**2 + np.abs(window_data)**2))
    
    # Calculate spectrogram
    df1 = 1/(pars['spectrogram']['N_d']/fsd1)
    freq_range = np.arange(pars['DEMON']['minfreq'], pars['DEMON']['maxfreq'] + df1, df1)
    nperseg = pars['spectrogram']['N_d']
    noverlap = int(5 * nperseg / 6)
    
    f, t, sd = signal.spectrogram(rms_values, fs=fsd1, nperseg=nperseg, 
                                 noverlap=noverlap, scaling='density',
                                 window='hann', mode='complex')
    
    # Filter frequencies within the desired range
    mask = (f >= pars['DEMON']['minfreq']) & (f <= pars['DEMON']['maxfreq'])
    sd = sd[mask]
    f = f[mask]
    
    return sd, f, t

def analyze_audio_file(file_path):
    """
    Analyze a single audio file
    
    Args:
        file_path: Path to the WAV file
    """
    # Initialize parameters
    pars = {
        'AnalysisWindowwidth': 1,
        'NoiseWindow': [0, 1],
        'broadband': {
            'FrequencyWindow': np.array([[100, 1000], 
                                       [500, 5000], 
                                       [100, 10000]]),
            'order': 4
        },
        'DEMON': {
            'fsd': 200,
            'bandpass': {
                'f_low': 100,
                'order': 4
            },
            'N': 15,
            'NumLines': 5,
            'minfreq': 0,
            'maxfreq': 100
        },
        'spectrogram': {
            'N': 32 * 1024,
            'N_d': 990
        },
        'narrowband': {
            'N': 50,
            'minfreq': 50,
            'maxfreq': 1000,
            'NumLines': 5
        }
    }
    
    # Load audio file
    fs, data = wavfile.read(file_path)
    
    # Convert to float and normalize if needed
    if data.dtype == np.int16:
        data = data.astype(np.float32) / 32768.0
    elif data.dtype == np.int32:
        data = data.astype(np.float32) / 2147483648.0
    
    # If stereo, convert to mono by averaging channels
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)
    
    # Create time array
    t = np.arange(len(data)) / fs
    
    # Define noise window
    noise_mask = (t <= pars['NoiseWindow'][1]) & (t >= pars['NoiseWindow'][0])
    noise_data = data[noise_mask]
    
    # Initialize arrays
    t2 = []
    BBsignal = []
    
    # Process analysis windows
    for k in range(2, int(np.max(t) / pars['AnalysisWindowwidth'])):
        # Define analysis window
        an_mask = (t <= (pars['NoiseWindow'][1] + (k-1)*pars['AnalysisWindowwidth'])) & \
                 (t >= (pars['NoiseWindow'][0] + (k-1)*pars['AnalysisWindowwidth']))
        an_data = data[an_mask]
        
        if len(an_data) > 0:  # Only process if we have data in this window
            t2.append(np.mean(t[an_mask]))
            
            # Broadband detection
            bb = broad_band_analysis(an_data, noise_data, fs, pars)
            BBsignal.append(bb)
    
    # Convert lists to numpy arrays
    t2 = np.array(t2)
    BBsignal = np.array(BBsignal)
    
    # Perform DEMON analysis
    sd, fd, td = demon_analysis(data, fs, pars)
    
    # Normalize DEMON spectrum
    DEnorm = np.abs(sd)**2
    DEnorm = DEnorm / signal.medfilt(DEnorm, kernel_size=pars['DEMON']['N'])
    DEnorm[:2, :] = 1e-10
    DEnorm[-2:, :] = 1e-10
    
    # Find strongest lines
    DEfreq = np.zeros((len(td), pars['DEMON']['NumLines']))
    DESNR = np.zeros((len(td), pars['DEMON']['NumLines']))
    
    for k in range(len(td)):
        sorted_idx = np.argsort(DEnorm[:, k])
        DEfreq[k, :] = np.sort(fd[sorted_idx[-pars['DEMON']['NumLines']:]])
        DESNR[k, :] = 10 * np.log10(np.sort(DEnorm[sorted_idx[-pars['DEMON']['NumLines']:], k]))
    
    # Plot results
    plot_results(t, data, t2, BBsignal, td, DESNR, fd, DEnorm, DEfreq, pars)
    
    return {
        'time': t,
        'data': data,
        'BBsignal': BBsignal,
        'DEfreq': DEfreq,
        'DESNR': DESNR,
        'DEnorm': DEnorm
    }

def plot_results(t, data, t2, BBsignal, td, DESNR, fd, DEnorm, DEfreq, pars):
    """
    Plot the analysis results
    """
    fig, axes = plt.subplots(3, 2, figsize=(12, 10))
    
    # Plot 1: Raw audio
    axes[0, 0].plot(t, data)
    axes[0, 0].set_xlabel('Time [s]')
    axes[0, 0].set_ylabel('Amplitude')
    axes[0, 0].grid(True)
    axes[0, 0].set_title('Raw Audio Signal')
    
    # Plot 2: Broadband signal
    for i in range(BBsignal.shape[1]):
        axes[0, 1].plot(t2, BBsignal[:, i])
    axes[0, 1].set_xlabel('Time [s]')
    axes[0, 1].set_ylabel('BBnorm')
    axes[0, 1].grid(True)
    axes[0, 1].set_title('Broadband Analysis')
    
    # Add legend for broadband frequencies
    BBleg = [f"{int(freq[0])} - {int(freq[1])} Hz" 
             for freq in pars['broadband']['FrequencyWindow']]
    axes[0, 1].legend(BBleg)
    
    # Plot 3: DEMON SNR
    axes[1, 0].plot(td, DESNR, '.')
    axes[1, 0].set_xlabel('Time [s]')
    axes[1, 0].set_ylabel('DEMON SNR')
    axes[1, 0].grid(True)
    axes[1, 0].set_title('DEMON SNR')
    
    # Plot 4: Empty (for future use)
    axes[1, 1].set_visible(False)
    
    # Plot 5: DEMON spectrogram
    im = axes[2, 0].imshow(10 * np.log10(np.abs(DEnorm)), 
                          aspect='auto', origin='lower',
                          extent=[td[0], td[-1], fd[0], fd[-1]])
    axes[2, 0].plot(td, DEfreq, 'w.', markersize=3)
    axes[2, 0].set_xlabel('Time (s)')
    axes[2, 0].set_ylabel('Demon Frequency [Hz]')
    axes[2, 0].set_ylim([pars['DEMON']['minfreq'], pars['DEMON']['maxfreq']])
    plt.colorbar(im, ax=axes[2, 0])
    axes[2, 0].grid(True)
    axes[2, 0].set_title('DEMON Spectrogram')
    
    # Plot 6: Empty (for future use)
    axes[2, 1].set_visible(False)
    
    plt.tight_layout()
    plt.show()

# Example usage
if __name__ == "__main__":
    # Replace with your WAV file path
    file_path = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/001029.wav"
    results = analyze_audio_file(file_path)