import numpy as np
import scipy.signal as signal

def narrowband_analysis(mixseg, noiseseg, Fs, pars):
    """
    Performs a narrowband analysis of the signal.

    Parameters:
        mixseg (numpy array): Mixed signal segment.
        noiseseg (numpy array): Noise signal segment.
        Fs (int): Sampling frequency.
        pars (dict): Parameters dictionary.

    Returns:
        NBSNR (numpy array): Narrowband SNR values.
        NBfreq (numpy array): Frequencies of detected narrowband signals.
    """
    S = np.abs(np.fft.fft(mixseg)) ** 2  # Spectral level
    S = S[:len(S)//2]
    Sn = np.abs(np.fft.fft(noiseseg)) ** 2  # Noise spectral level
    Sn = Sn[:len(Sn)//2]

    f = Fs * np.arange(len(S)) / len(S)  # Frequency vector

    # Whitening
    Snorm = S / Sn
    Snorm = signal.medfilt(Snorm, kernel_size=pars["narrowband"]["N"])

    # Keeping only frequency components within the frequency window
    valid_indices = (f > pars["narrowband"]["minfreq"]) & (f < pars["narrowband"]["maxfreq"])
    Snorm = Snorm[valid_indices]
    f = f[valid_indices]

    # Finding the N strongest peaks
    sorted_indices = np.argsort(Snorm)
    NBfreq = np.sort(f[sorted_indices[-pars["narrowband"]["NumLines"]:]])
    NBSNR = 10 * np.log10(Snorm[sorted_indices[-pars["narrowband"]["NumLines"]:]])

    return NBSNR, NBfreq
