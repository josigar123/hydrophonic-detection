import numpy as np
from scipy.signal import hilbert, resample_poly
from utils import moving_average_padded

def BB_data(Sx, Fs, hilbert_win, window_size, Threshold):
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
    t = np.linspace(0,len(BB_sig)/Fs,len(BB_sig))
    return BB_sig, t