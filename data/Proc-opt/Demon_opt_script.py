import sys
import os

# Get the absolute path to the sibling directory
module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Processing_scripts'))

# Add the module path to sys.path
sys.path.append(module_path)

# Now import your module
import functions


import numpy as np
import matplotlib.pyplot as plt
from concurrent.futures import ProcessPoolExecutor
from time import perf_counter
import matplotlib.cm as cm
from mpl_toolkits.mplot3d import Axes3D
import pandas as pd
import scipy.signal as signal

def compute_DEMON(i, j, k, l, sx, fs, fds, tperseg, freq_filt, hfilt_length):
    tperseg = tperseg * (i + 1)
    freq_filt = freq_filt + (2*j +1) #Only odd
    hfilt_length = hfilt_length * (k + 1)
    fds = fds + (50 * l)

    t0 = perf_counter()
    td, fd, sx_dem = functions.DEMON_from_data(sx, fs, fds, tperseg, freq_filt, hfilt_length ,fmax=fds/2, s_max=10, window="hamming", plot=False)
    t1 = perf_counter()
    time = t1 - t0
    print(f"tperseg: {tperseg} , freq_filt: {freq_filt} , hfilt_length: {hfilt_length} , fds: {fds} , t: {time} ")

    

    #SNR clculated as an average over a set region of spectrogram
    """
    NB! SNR_t & SNR_f needs to fit within the resolution of the plot

    Frequency resolution: 1/tperseg
    Time resolution = hfil_length

    Plot one picture, then input start and stop for t and f manually?
    """
    try:
        t_start = 600
        t_start = np.where((td-t_start) >= 0)[0][0]

        t_stop = 800
        if t_stop > td[-1]:
             t_stop = td[-1]
        
        t_stop = np.where((td-t_stop) >= 0)[0][0]

        f_start = 100
        f_start = np.where((fd-f_start) >= 0)[0][0]

        f_stop = 115
        f_stop = np.where((fd-f_stop) >= 0)[0][0]

        SNR_t = (t_start,t_stop) #touple, start and stop time for region [s]
        SNR_f = (f_start, f_stop) #touple, start and stop for frequency region [Hz]. NB!
    except:
         print("td: ",td)
         print("SNR_t, SNR_f ERROR")
        
    try:
         SNR = np.mean(sx_dem[f_start:f_stop ,t_start:t_stop])
    except:
         print("SNR ERROR")

    return i, j, k, l, SNR, time

def main():
    print("Starting program...")

    Audio_path = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/torrtst2.wav"

    fs = 10_000

    tot_time = 0

    #Start vals
    tperseg = 1 
    freq_filt = 4 #Must be kept odd
    hfilt_length = 5
    fds = 500

    time = 0

    #No. of iterations pr param.
    num_tperseg_iterations = 4          #i
    num_freq_filt_iterations = 3        #j
    num_hfilt_length_iterations = 5     #k
    num_fds_iterations = 2              #l


    sx, fs = functions.load_audiofile(Audio_path, fs, fc_low=5)

    SNR_vals = np.zeros((num_tperseg_iterations,num_freq_filt_iterations,num_hfilt_length_iterations,num_fds_iterations))
    t_arr = np.zeros((num_tperseg_iterations,num_freq_filt_iterations,num_hfilt_length_iterations,num_fds_iterations))

    with ProcessPoolExecutor() as executor:
        futures = [executor.submit(compute_DEMON, i, j, k, l, sx, fs, fds, tperseg, freq_filt, hfilt_length)
                    for i in range(num_tperseg_iterations)
                    for j in range(num_freq_filt_iterations)
                    for k in range(num_hfilt_length_iterations)
                    for l in range(num_fds_iterations)
                    ]
        for future in futures:
                i, j, k, l, SNR, time = future.result()
                SNR_vals[i][j][k][l] = SNR
                t_arr[i][j][k][l] = round(time, 2)
                tot_time += time
    # Flatten til en DataFrame
    data = []

    for idx, val in np.ndenumerate(SNR_vals):
        a, b, c, d = idx
        data.append({
            "tperseg": (a+1)*tperseg,
            "freq_filt": freq_filt + (2*b +1),
            "hfilt_length": (c+1)*hfilt_length,
            "fds": fds + (50 * d),
            "max_SNR": val,
            "time": t_arr[a,b,c,d]
        })

    df = pd.DataFrame(data)
    df.to_csv("/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/data/Proc-opt/DEMON_avg_SNR.csv", index=False)
    print(f"SNR_vals: {SNR_vals}")
    print("DONE!")

if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()  # spesielt for Windows, men har ingen bivirkninger på macOS
    main()
