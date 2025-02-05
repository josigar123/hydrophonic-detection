import numpy as np
import scipy.signal as signal

def broadband_analysis(mixseg, noise, Fs, pars):
    BBsignal = []
    
    for j in range(len(pars['broadband']['FrequencyWindow'])):
        # Design the filter
        b, a = signal.butter(pars['broadband']['order'], 
                             np.array(pars['broadband']['FrequencyWindow'][j]) / Fs, 
                             btype='bandpass')

        # Apply the filter
        filtered_audio = signal.filtfilt(b, a, mixseg)
        filtered_noise = signal.filtfilt(b, a, noise)

        # Remove NaN and Inf values
        filtered_audio = filtered_audio[np.isfinite(filtered_audio)]
        filtered_noise = filtered_noise[np.isfinite(filtered_noise)]

        # Calculate broadband signal
        BBsignal.append(10 * np.log10(np.sum(np.abs(filtered_audio)**2) / 
                                      np.sum(np.abs(filtered_noise)**2)))

    return np.array(BBsignal)
