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
        
        channels = self.convert_n_channel_signal_to_n_arrays(pcm_data)
        
        # Calculate spectrogram
        nperseg=int(tperseg*self.sample_rate)
        
        f = np.ndarray
        t = np.ndarray
        freq, times, power = signal.spectrogram(channels[0], self.sample_rate, window=window, nperseg=nperseg, detrend=False)
        sx_norm = np.zeros_like(power)
        for channel in channels:
            freq, times, power = signal.spectrogram(channel, self.sample_rate, window=window, nperseg=nperseg, detrend=False)
            f = freq
            t = times
            current_sx_norm = medfilt_vertcal_norm(power,freq_filt)
            sx_norm = np.add(sx_norm, current_sx_norm)
            
        sx_db = 10*np.log10(sx_norm)   # Convert to dB
        sx_db, f, t = spec_hfilt2(sx_db,f,t,window_length=hfilt_length)

        return f.tolist(), t.tolist(), sx_db.tolist()
    
    def generate_demon_spectrogram_data(self, pcm_data: bytes, demon_sample_frequency: int, tperseg: float, freq_filt: int, hfilt_length: int, window: str):

        print("LENGTH OF PCM DATA: ", len(pcm_data))
        channels = self.convert_n_channel_signal_to_n_arrays(pcm_data)
        print("FIRST 100 bytes of PCM DATA: ", pcm_data[:101])
        print("NUMBER OF CHANNELS: ",len(channels))
        # Frequency data calculation
        nperseg = int(demon_sample_frequency * tperseg)  # Number of samples in time axis to use for each vertical spectrogram column
        
        # RMS data of Hilbert transform
        kernal_size = int(self.sample_rate/demon_sample_frequency) 
        analytic_signal = np.abs(hilbert(channels[0]))**2
        rms_values = average_filter(analytic_signal, kernal_size)
        # Generate spectrogram
        fd_rms, td_rms, sxx_rms = signal.spectrogram(rms_values, demon_sample_frequency,
                                                        nperseg=nperseg,
                                                        noverlap=5 * nperseg // 6,
                                                        window=window)
        # Normalize sxx
        sxx_rms_norm = medfilt_vertcal_norm(spec=sxx_rms, vertical_medfilt_size=freq_filt)
        sxx_rms_norm = np.zeros_like(sxx_rms_norm)
        print("PRE LOOP NORM RMX: ", sxx_rms_norm[:11])
        for channel in channels:
            analytic_signal = np.abs(hilbert(channel))**2
            rms_values = average_filter(analytic_signal, kernal_size)

            # Generate spectrogram
            fd_rms, td_rms, sxx_rms = signal.spectrogram(rms_values, demon_sample_frequency,
                                                        nperseg=nperseg,
                                                        noverlap=5 * nperseg // 6,
                                                        window=window)
            # Normalize sxx
            current_sxx_rms_norm = medfilt_vertcal_norm(spec=sxx_rms, vertical_medfilt_size=freq_filt)
            sxx_rms_norm = np.add(sxx_rms_norm, current_sxx_rms_norm)

        print("td_rms: ", td_rms)
        print("fd_rms: ", fd_rms)
        print("10 FIRST NORM RMX: ", sxx_rms_norm[:11])
        
        sxx_rms_norm_db = 10 * np.log10(sxx_rms_norm)
        print("SXXRMS DB: ", sxx_rms_norm_db)
        # Apply frequency and time-domain filters
        sxx_db, fd_rms, td_rms = spec_hfilt2(sxx_rms_norm_db, fd_rms, td_rms, window_length=hfilt_length)
        # Highpass cut filter
        fc = 5 # Hz
        sxx_db[0:int(fc*tperseg+1),:] = 0
        print("SXX_DB IN SIGNAL PROCESSING SERVICE: ", sxx_db)
        print("FD_RMS: ", fd_rms)
        print("td_rms: ", td_rms)
        return fd_rms.tolist(), td_rms.tolist(), sxx_db.tolist()

    # Take a spectrogram matrix containing intensities and a threshold in dB
    def narrowband_detection(self, spectrogram_db: np.ndarray, threshold: int) -> bool:
        return np.any(spectrogram_db > threshold)

    '''Function for generating the broadband plot, returns the broadband signal in time domain, and time bins'''
    def generate_broadband_data(self, pcm_data: bytes, hilbert_win, window_size):

        channels = self.convert_n_channel_signal_to_n_arrays(pcm_data)

        # Apply Hilbert transform to the signal, take the absolute value, square the result (power envelope), and then apply a median filter
        # to smooth the squared analytic signal. The window size for the median filter is defined by `medfilt_window`.
        pre_envelope = moving_average_padded(np.square(np.abs(hilbert(channel))),hilbert_win)
        envelope = np.zeros_like(pre_envelope)
        for channel in channels:
            currentEnvelope = moving_average_padded(np.square(np.abs(hilbert(channel))),hilbert_win)
            envelope = np.add(envelope, currentEnvelope)

        # Downsample the filtered signal
        downsampled_signal = resample_poly(envelope, 1, hilbert_win)  # Resample by the median filter window size
        downsampled_sample_rate = self.sample_rate / hilbert_win  # New sampling rate after downsampling

        # Define kernel size for the median filter based on window size
        kernel_size = int(window_size * downsampled_sample_rate) | 1  # Ensure odd size
        signal_med = moving_average_padded(downsampled_signal, kernel_size)  # Apply median filter for further noise removal

        broadband_signal = 10*np.log10(signal_med)
        t = np.linspace(0,len(broadband_signal)/downsampled_sample_rate,len(broadband_signal))

        return broadband_signal, t

    def broadband_detection(self, filo_buffer: np.ndarray, threshold: int, window_size: int):

        min_val = np.min(filo_buffer)
        last_win = filo_buffer[-window_size*self.sample_rate:]

        return True in (last_win > min_val + threshold)

    def convert_n_channel_signal_to_n_arrays(self, pcm_data: bytes):
        
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
        
        channels = [samples[:, i] for i in range(self.num_channels)]
        
        return channels