import numpy as np
from scipy import signal


def medfilt_vertcal_norm(spec,vertical_medfilt_size):

    #med filt over hver kolonne
    sxx_med = np.zeros_like(spec)
    for i in range(spec.shape[1]):
        sxx_med[:,i] = signal.medfilt(spec[:,i],kernel_size=vertical_medfilt_size)

    #Normaliserer sxx
    sxx_norm = spec/sxx_med

    return sxx_norm

def spec_hfilt2(spec, freq, time, window_length: float):
    """
    Compute a spectrogram and smooth it along the time axis by averaging within time segments.

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

def moving_average_padded(signal, window_size=5):
    pad_size = window_size // 2
    padded_signal = np.pad(signal, pad_size, mode='edge')  # Repeat edge values
    kernel = np.ones(window_size) / window_size
    smoothed = np.convolve(padded_signal, kernel, mode='valid')  # Only keep valid parts
    return smoothed

# This will return the number of samples required to fill hfilt_length seconds of sound 
def calculate_required_samples(hfilt_length: int, sample_rate: int):
    return int(hfilt_length * sample_rate)

def calculate_bytes_per_sample(bit_depth: int, channels: int):
    '''Function could be generalized, but we want to ensure a valid bit depth'''
    if bit_depth == 16:
        return 2 * channels  # 16-bit is 2 bytes per channel
    elif bit_depth == 32:
        return 4 * channels  # 32-bit is 4 bytes per channel
    else:
        raise ValueError(f"Unsupported bit depth: {bit_depth}")

def moving_average_zero_padded(signal, window_size=5):
    pad_size = window_size // 2
    padded_signal = np.pad(signal, pad_size, mode="constant",constant_values=0)  # Repeat edge values
    kernel = np.ones(window_size) / window_size
    smoothed = np.convolve(padded_signal, kernel, mode="full")  # Only keep valid parts
    return smoothed