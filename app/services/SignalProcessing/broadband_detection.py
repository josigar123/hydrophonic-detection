import numpy as np
from scipy.signal import hilbert, resample_poly
from utils import moving_average_padded

'''Function for generating the broadband plot, returns the broadband signal in time domain, and time bins'''
def broadband_data(Sx, Fs, hilbert_win, window_size):
    # Apply Hilbert transform to the signal, take the absolute value, square the result (power envelope), and then apply a median filter
    # to smooth the squared analytic signal. The window size for the median filter is defined by `medfilt_window`.
    envelope = moving_average_padded(np.square(np.abs(hilbert(Sx))),hilbert_win)

        # Downsample the filtered signal
    downsampled_signal = resample_poly(envelope, 1, hilbert_win)  # Resample by the median filter window size
    downsampled_sample_rate = Fs / hilbert_win  # New sampling rate after downsampling

    # Define kernel size for the median filter based on window size
    kernel_size = int(window_size * downsampled_sample_rate) | 1  # Ensure odd size
    signal_med = moving_average_padded(downsampled_signal, kernel_size)  # Apply median filter for further noise removal

    broadband_signal = 10*np.log10(signal_med)
    t = np.linspace(0,len(broadband_signal)/downsampled_sample_rate,len(broadband_signal))
    return broadband_signal, t


def broadband_trigger(sx, fs, threshold, window_size):
    """
    INPUT:
        sx: 1D array of float - signal in time domain
        fs: samplerate of sx
        Trigger_val: desired trigger threshold in dB
        window_size: Seconds of window to analyse

    OUTPUT:
        Bool: True if last (window_size) seconds surpasses threshold

    """
    min_val = np.min(sx)
    last_win = sx[-window_size*fs:]

    return True in (last_win > min_val + threshold)