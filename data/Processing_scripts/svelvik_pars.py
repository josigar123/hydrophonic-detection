Pioner_pars = {
    "fs": 10_000,  # Sample frequency
    "broadband": {
        "hilbert_win": 50 ,
        "window_size": 22,
        "trigger" : 10,
    },
    "DEMON": {
        "fds": 900,
        "tperseg": 2,
        "freq_filt": 39,
        "hfilt_length": 5,
        "minfreq": 0,
        "maxfreq": 450, #if None, def. fds/2
        "vmin": None, #if None, def. 10*log10(len(sx))
        "vmax": 10,
        "window": "hann",
    },
    "spectrogram": {
        "tperseg": 1,
        "freq_filt": 13,
        "hfilt_length": 10,
        "minfreq": 0,
        "maxfreq": 1000,
        "vmin": None, #if None, def. 10*log10(len(sx))
        "vmax": 10,
        "window": "hann",
    },
}