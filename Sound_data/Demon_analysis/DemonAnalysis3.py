import numpy as np
import scipy.signal as signal
from scipy.signal import butter, hilbert, spectrogram

def demon_analysis(audio_data, Fs, pars):
    # Design the bandpass filter
    b, a = butter(pars['DEMON']['bandpass']['order'], 
                  [pars['DEMON']['bandpass']['f_low'] / (Fs / 2), 0.99], 
                  btype='bandpass')

    # Apply the filter
    filtered_audio = signal.filtfilt(b, a, audio_data)

    # Define window length
    d = round(1 / pars['DEMON']['fsd'] * Fs)
    fsd1 = Fs / d

    # Calculate number of windows
    num_windows = len(filtered_audio) // d

    # RMS calculation
    rms_values = np.zeros(num_windows)
    for i in range(num_windows):
        start_idx = i * d
        end_idx = min((i + 1) * d, len(filtered_audio))
        window_data = filtered_audio[start_idx:end_idx]

        # Envelope detection using Hilbert transform
        rms_values[i] = np.sqrt(np.mean(np.abs(hilbert(window_data))**2 + np.abs(window_data)**2))

    # Spectrogram
    df1 = 1 / (pars['spectrogram']['N_d'] / fsd1)
    print(f"nfft = {int((pars['DEMON']['maxfreq'] - pars['DEMON']['minfreq']) / df1)}")
    print(f"nperseg = {pars['spectrogram']['N_d']}")
    f, t, sd = spectrogram(rms_values, fsd1, 
                           nperseg=pars['spectrogram']['N_d'], 
                           noverlap=5 * pars['spectrogram']['N_d'] // 6,
                           nfft=int((pars['DEMON']['maxfreq'] - pars['DEMON']['minfreq']) / df1),
                           scaling='density')

    return sd, t, f
