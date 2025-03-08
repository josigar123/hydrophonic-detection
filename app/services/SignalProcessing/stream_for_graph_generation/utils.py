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