from scipy import signal
from scipy.signal import hilbert, resample_poly
import numpy as np
from utils import average_filter, spec_hfilt2, medfilt_vertcal_norm

# Fds settes av brukeren, (nytt) default: 200
# freq_filt skal settes (Hz bins) glatter ut frekvens bøtter (verdier det blir plottet intensiteter for)
# hfilt_lenth skal settes av bruker (sekunder) tilsvarende(ish) freq_filt, men langs tidsaksen
# frequency bins bestemmes utifra, frekvens aksen går opp til halvparten av sample_raten


# Antall bins som skal plottes vil være fbins = fmax * tperseg, tperseg er sekunder av lyddata for spektrogram fft
"""
    BEGRENSNING:
    
    Parameter for DEMON og spektrogram analyse skal forhåndsbestemmer før en "sesjon" er påbegynt
    
"""

"""
    
    For bredbåndsanalysen, ta vare på minste verdien y-verdien i BBnorm plottet
    Brukeren setter terskel for deteksjon
    Terskelen representerer intervallet av desibel hvor det ikke er fartøy. Overskrides terskel
    er det en deteksjon.
    
    data_min er den minste amplitudeverdien i hele plot-visningen av BBNorm plottet
    Trigger == True if data  >= Terskel (dB) + data_min
    
    
"""

def DEMON_from_data(sx, fs, Fds, tperseg, freq_filt, hfilt_length, fmax=100, s_max=10, window="hamming"):
    """
    PARAMETERS:
        sx: array_like
            Time series of measurement values

        fs: int
            Sample frequency
        
        Fds: int
            Demon sample frequency
        
        freq_filt: int (odd)
            Number of frequency bins for smoothing and normalizing
        
        hfilt_length: int
            Number of time bins for smoothing
        
        fmax: float
            Max frequency for DEMON spectrogram
        
        s_max: float
            Max dB on spectrogram
        
        window: str
            Spectrogram window
    
    RETURN:
        Plots the DEMON specrtogram for a given time series
    """
    
    #RMS data of hilbert
    kernal_size = int(fs/Fds) 
    analytic_signal = np.abs(hilbert(sx))**2
    rms_values = average_filter(analytic_signal, kernal_size)

    #hente freq
    nperseg= Fds * int(tperseg) #Number of samples in time axis to use for each vertical spectrogram coloumn

    fd_rms, td_rms, sxx_rms = signal.spectrogram(rms_values,Fds,
                                                    nperseg=nperseg,
                                                    noverlap=5*nperseg//6,
                                                    #nfft=int(200*kernal_size / nperseg),
                                                    window=window
                                                    )


    #Normaliserer sxx
    sxx_rms_norm = medfilt_vertcal_norm(spec=sxx_rms,vertical_medfilt_size=freq_filt)
    sxx_db, fd_rms, td_rms = spec_hfilt2(10*np.log10(sxx_rms_norm),fd_rms,td_rms,window_length=hfilt_length)
        
    return td_rms, fd_rms, sxx_db