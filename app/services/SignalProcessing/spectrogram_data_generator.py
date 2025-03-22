from scipy import signal
import numpy as np
from scipy.signal import hilbert
from utils import average_filter, spec_hfilt2, medfilt_vertcal_norm

'''

This file will be used to handle streaming of the spectrogram data generated
by the wav-chunks recieved from the PI

'''
class SpectrogramDataGenerator:
    
    # Constructor with default values
    def __init__(self):
        pass
    
    # hfilt_length determines the minimum length of the audio signal to be supplied to the function
    # Maybe create an in-memory wav file inside here before passing to signal.spectrogram for simplicity, adds a
    # bit of overhead, but it can be afforded
    def create_spectrogram_data(self, pcm_data: bytes, sample_rate: float, channels: int, tperseg: float, freq_filt: int, hfilt_length: int, window: str, bit_depth: int = 16):
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
            Max. on frequency axis, value should only have a use in frontend
        freq_filt: int (odd)
            Number of frequency bins for smoothing and normalizing
        hfilt_length: int
            Number of time bins for horizontal smoothing
        s_min: int
            Minimum intensity of plot, only on frontend
        s_max: int
            Maximum intensity of plot, only on frontend
        """       

        if bit_depth == 16:
            samples = np.frombuffer(pcm_data, dtype=np.int16)
        else:
            raise ValueError(f"Unsupported bit depth: {bit_depth}")

        # Check if the PCM data is stereo (multi-channel) or mono
        if channels > 1:
        # Reshape PCM data to separate channels
            try:
                samples = samples.reshape(-1, channels)
            except ValueError as e:
                raise ValueError(f"Error reshaping PCM data. Expected {channels} channels, but got data size {samples.shape[0]}") from e
            # Convert to mono by averaging channels
            mono_signal = np.mean(samples, axis=1)
        else:
            # PCM data is already mono, no need to reshape
            mono_signal = samples

        # Calculate spectrogram
        nperseg=int(tperseg*sample_rate)
        f, t, sx = signal.spectrogram(mono_signal, sample_rate, window=window, nperseg=nperseg, detrend=False)
        sx_norm = medfilt_vertcal_norm(sx,freq_filt)
        sx_db = 10*np.log10(sx_norm)   # Convert to dB
        sx_db, f, t = spec_hfilt2(sx_db,f,t,window_length=hfilt_length)

        return f.tolist(), t.tolist(), sx_db.tolist()
    
    def create_demon_spectrogram_data(self, pcm_data: bytes, sample_rate: float, demon_sample_frequency: int, channels: int, tperseg: float, freq_filt: int, hfilt_length: int, window: str, bit_depth: int = 16):
        if bit_depth == 16:
            samples = np.frombuffer(pcm_data, dtype=np.int16)
            print(f"Samples shape after conversion: {samples.shape}")
        else:
            raise ValueError(f"Unsupported bit depth: {bit_depth}")

        # Check if the PCM data is stereo (multi-channel) or mono
        if channels > 1:
            try:
                samples = samples.reshape(-1, channels)
                print(f"Reshaped PCM data into {channels} channels.")
            except ValueError as e:
                raise ValueError(f"Error reshaping PCM data. Expected {channels} channels, but got data size {samples.shape[0]}") from e
            # Convert to mono by averaging channels
            mono_signal = np.mean(samples, axis=1)
            print(f"Converted to mono by averaging channels. Mono signal length: {len(mono_signal)}")
        else:
            # PCM data is already mono, no need to reshape
            mono_signal = samples
            print(f"PCM data is already mono. Signal length: {len(mono_signal)}")

        # RMS data of Hilbert transform
        kernal_size = int(sample_rate/demon_sample_frequency) 
        analytic_signal = np.abs(hilbert(mono_signal))**2
        rms_values = average_filter(analytic_signal, kernal_size)
        print(f"RMS values computed. Length: {len(rms_values)}")

        # Frequency data calculation
        nperseg = demon_sample_frequency * int(tperseg)  # Number of samples in time axis to use for each vertical spectrogram column
        print(f"nperseg calculated: {nperseg}")

        # Generate spectrogram
        fd_rms, td_rms, sxx_rms = signal.spectrogram(rms_values, demon_sample_frequency,
                                                    nperseg=nperseg,
                                                    noverlap=5 * nperseg // 6,
                                                    window=window)
        print(f"Spectrogram computed. Frequency bins: {len(fd_rms)}, Time bins: {len(td_rms)}")
        print(f"Spectrogram shape: {sxx_rms.shape}")

        # Normalize sxx
        sxx_rms_norm = medfilt_vertcal_norm(spec=sxx_rms, vertical_medfilt_size=freq_filt)
        print(f"Spectrogram normalization completed. Shape: {sxx_rms_norm.shape}")

        # Apply frequency and time-domain filters
        sxx_db, fd_rms, td_rms = spec_hfilt2(10 * np.log10(sxx_rms_norm), fd_rms, td_rms, window_length=hfilt_length)
        print(f"After filtering: Length of sxx_db: {len(sxx_db)}")

        # Return results as lists
        print(f"Returning values: fd_rms={fd_rms.tolist()}, td_rms={td_rms.tolist()}, sxx_db={sxx_db.tolist()}")
        return fd_rms.tolist(), td_rms.tolist(), sxx_db.tolist()
            