import numpy as np
from scipy import signal
from utils import average_filter, spec_hfilt2, medfilt_vertcal_norm, moving_average_padded
from scipy.signal import hilbert, resample_poly

'''

This class is an interface to all the signal processing the system will perform, utilities to the signal
processing can be found in utils.py

'''

class SignalProcessingService:
    
    def __init__(self, sample_rate: int, num_channels: int, bit_depth: int):
        self.sample_rate = sample_rate
        self.num_channels = num_channels
        self.bit_depth = bit_depth

    def generate_spectrogram_data(self, pcm_data: bytes, tperseg: float, freq_filt: int, hfilt_length: int, window: str):
        
        #Average signal over all channels
        mono_signal = self.convert_n_channel_signal_to_mono(pcm_data)

        # Calculate spectrogram
        nperseg=int(tperseg*self.sample_rate)
        f, t, sx = signal.spectrogram(mono_signal, self.sample_rate, window=window, nperseg=nperseg, detrend=False)
        sx_norm = medfilt_vertcal_norm(sx,freq_filt)
        sx_db = 10*np.log10(sx_norm)   # Convert to dB
        sx_db, f, t = spec_hfilt2(sx_db,f,t,window_length=hfilt_length)

        return f.tolist(), t.tolist(), sx_db.tolist()
    
    def generate_demon_spectrogram_data(self, pcm_data: bytes, demon_sample_frequency: int, tperseg: float, freq_filt: int, hfilt_length: int, window: str):

        # Average the signal over all channels
        mono_signal = self.convert_n_channel_signal_to_mono(pcm_data)

        # RMS data of Hilbert transform
        kernal_size = int(self.sample_rate/demon_sample_frequency) 
        analytic_signal = np.abs(hilbert(mono_signal))**2
        rms_values = average_filter(analytic_signal, kernal_size)

        # Frequency data calculation
        nperseg = demon_sample_frequency * int(tperseg)  # Number of samples in time axis to use for each vertical spectrogram column

        # Generate spectrogram
        fd_rms, td_rms, sxx_rms = signal.spectrogram(rms_values, demon_sample_frequency,
                                                    nperseg=nperseg,
                                                    noverlap=5 * nperseg // 6,
                                                    window=window)

        # Normalize sxx
        sxx_rms_norm = medfilt_vertcal_norm(spec=sxx_rms, vertical_medfilt_size=freq_filt)

        # Apply frequency and time-domain filters
        sxx_db, fd_rms, td_rms = spec_hfilt2(10 * np.log10(sxx_rms_norm), fd_rms, td_rms, window_length=hfilt_length)

        return fd_rms.tolist(), td_rms.tolist(), sxx_db.tolist()

    # Take a spectrogram matrix containing intensities and a threshold in dB
    def narrowband_detection(self, spectrogram_db: np.ndarray, threshold: int) -> bool:
        return np.any(spectrogram_db > threshold)

    '''
    
        hilbert_win: en mengde samples samples til ett gjennomsnitt data punkt, får da et nytt antall samples: original_samples / hilber_win
        window_size: antall sekunder som skal glattes ut, bestemmer minimum sekunder data som må samles?
                     må være lik for broadband_trigger og
        
        
    
    '''

    '''Function for generating the broadband plot, returns the broadband signal in time domain, and time bins'''
    def generate_broadband_data(self, pcm_data: bytes, hilbert_win, window_size):

        # Average the signal over all channels
        mono_signal = self.convert_n_channel_signal_to_mono(pcm_data)

        # Apply Hilbert transform to the signal, take the absolute value, square the result (power envelope), and then apply a median filter
        # to smooth the squared analytic signal. The window size for the median filter is defined by `medfilt_window`.
        envelope = moving_average_padded(np.square(np.abs(hilbert(mono_signal))),hilbert_win)

            # Downsample the filtered signal
        downsampled_signal = resample_poly(envelope, 1, hilbert_win)  # Resample by the median filter window size
        downsampled_sample_rate = self.sample_rate / hilbert_win  # New sampling rate after downsampling

        # Define kernel size for the median filter based on window size
        kernel_size = int(window_size * downsampled_sample_rate) | 1  # Ensure odd size
        signal_med = moving_average_padded(downsampled_signal, kernel_size)  # Apply median filter for further noise removal

        broadband_signal = 10*np.log10(signal_med)
        t = np.linspace(0,len(broadband_signal)/downsampled_sample_rate,len(broadband_signal))

        return broadband_signal, t

    def broadband_detection(self, filo_buffer: bytes, threshold: int, window_size: int):
        
        mono_signal = self.convert_n_channel_signal_to_mono(filo_buffer)

        min_val = np.min(mono_signal)
        last_win = mono_signal[-window_size*self.sample_rate:]

        return True in (last_win > min_val + threshold)

    def convert_n_channel_signal_to_mono(self, pcm_data: bytes):
        
        # System supports recording of bit-depth 16
        if self.bit_depth != 16:
            raise ValueError(f"Unsupported bit depth: {self.bit_depth}")
 

        samples = np.frombuffer(pcm_data, dtype=np.int16) 

        # signal is mono, early return
        if self.num_channels == 1:
            return samples
        
        if len(samples) % self.num_channels != 0:
            raise ValueError(f"Invalid PCM data size {len(samples)} for {self.num_channels} channels.")

        try:
            samples = samples.reshape(-1, self.num_channels)
        except ValueError as e:
            raise ValueError(f"Error reshaping PCM data. Expected {self.num_channels} channels, but got data size {samples.shape[0]}") from e
        
        # Convert to mono by averaging channels
        mono_signal = np.mean(samples, axis=1).astype(np.int16)
        
        return mono_signal