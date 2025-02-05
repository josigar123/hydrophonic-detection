from scipy import signal

def butter_highpass(cutoff, fs, order=5):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = signal.butter(order, normal_cutoff, btype='high', analog=False)
    return b, a

def butter_highpass_filter(data, cutoff, fs, order=5):
    b, a = butter_highpass(cutoff, fs, order=order)
    y = signal.filtfilt(b, a, data)
    return y


def Normalization_BroadBand(x,Norm_window,sample_rate):
    Num_samples = Norm_window * sample_rate
    for n in range(Num_samples):
        _sum = x[n]**2
    E = _sum/Num_samples
    return E