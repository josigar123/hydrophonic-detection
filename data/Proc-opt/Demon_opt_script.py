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
from scipy.ndimage import label

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

    1. Velg en frekvens
    2. Finn frekvens bøtte, ink. den rett over og rett under
    3. Sjekk disse tre bøttene for hvor langt i tid signalet strekker seg med verdi ofer T. Hva er T?
    4. Returner prosentvis tid

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
         SNR = np.mean(sx_dem[f_start:f_stop ,t_start:t_stop]) #Bytte til maks i området
         #Sjekker en frekvens, hvor langt ut i tid(prosent) "vises" den?
    except:
         print("SNR ERROR")


    freq = 112 #Hz
    freq_idx = np.argmin(np.abs(fd - freq))
    T = 2 #dB
    prosent_tid = prosent_tidsbøtter_med_verdi_over_T(sx_dem,T,freq_idx)
    prosent_tid_sammenhengende = prosent_tidsbøtter_fylt_av_lengste_gruppe(sx_dem,T,freq_idx)

    return i, j, k, l, SNR, time, prosent_tid, prosent_tid_sammenhengende


def prosent_tidsbøtter_fylt_av_lengste_gruppe(spektrogram, T, frekvens_idx):
    """
    Returnerer prosentvis hvor mye av tidsaksen som dekkes av lengste sammenhengende gruppe > T
    """
    f_start = max(frekvens_idx - 1, 0)
    f_slutt = min(frekvens_idx + 2, spektrogram.shape[0])

    sub_spektrogram = spektrogram[f_start:f_slutt, :]
    maske = sub_spektrogram > T

    struktur = np.array([[0,1,0],
                         [1,1,1],
                         [0,1,0]])

    labels, antall = label(maske, structure=struktur)

    max_lengde = 0
    for i in range(1, antall+1):
        posisjoner = np.argwhere(labels == i)
        tid_indekser = np.unique(posisjoner[:,1])
        max_lengde = max(max_lengde, len(tid_indekser))

    total_tidsbøtter = spektrogram.shape[1]
    prosent = (max_lengde / total_tidsbøtter) * 100
    return prosent

def prosent_tidsbøtter_med_verdi_over_T(spektrogram, T, frekvens_idx):
    """
    Returnerer prosentandel av tidsbøtter der minst én av de tre frekvensbøttene (midt +/-1)
    har verdi over T. Uavhengig av sammenheng.
    """
    f_start = max(frekvens_idx - 1, 0)
    f_slutt = min(frekvens_idx + 2, spektrogram.shape[0])  # +2 fordi slicing er eksklusiv

    sub_spektrogram = spektrogram[f_start:f_slutt, :]  # [3, tidsbøtter]
    
    # En maske som er True hvis noen frekvensbøtter > T for hver tidsbøtte
    tidsmaske = np.any(sub_spektrogram > T, axis=0)

    antall_over_T = np.sum(tidsmaske)
    total_tidsbøtter = spektrogram.shape[1]

    prosent = (antall_over_T / total_tidsbøtter) * 100
    return prosent



def main():
    print("Starting program...")

    Audio_path = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/torrtst2.wav"

    fs = 10_000

    tot_time = 0

    #Start vals
    tperseg = 1 
    freq_filt = 6 #Must be kept odd
    hfilt_length = 5
    fds = 500

    time = 0

    #No. of iterations pr param.
    num_tperseg_iterations = 4          #i
    num_freq_filt_iterations = 4        #j
    num_hfilt_length_iterations = 5     #k
    num_fds_iterations = 3              #l


    sx, fs = functions.load_audiofile(Audio_path, fs, fc_low=5)

    SNR_vals = np.zeros((num_tperseg_iterations,num_freq_filt_iterations,num_hfilt_length_iterations,num_fds_iterations))
    t_arr = np.zeros((num_tperseg_iterations,num_freq_filt_iterations,num_hfilt_length_iterations,num_fds_iterations))
    t_prosent_arr = np.zeros((num_tperseg_iterations,num_freq_filt_iterations,num_hfilt_length_iterations,num_fds_iterations))
    t_prosent_arr_sammenhengende = np.zeros((num_tperseg_iterations,num_freq_filt_iterations,num_hfilt_length_iterations,num_fds_iterations))

    with ProcessPoolExecutor() as executor:
        futures = [executor.submit(compute_DEMON, i, j, k, l, sx, fs, fds, tperseg, freq_filt, hfilt_length)
                    for i in range(num_tperseg_iterations)
                    for j in range(num_freq_filt_iterations)
                    for k in range(num_hfilt_length_iterations)
                    for l in range(num_fds_iterations)
                    ]
        for future in futures:
                i, j, k, l, SNR, time, prosent_tid, prosent_tid_sammenhengende = future.result()
                SNR_vals[i][j][k][l] = SNR
                t_arr[i][j][k][l] = round(time, 2)
                t_prosent_arr[i][j][k][l] = round(prosent_tid,4)
                t_prosent_arr_sammenhengende[i][j][k][l] = round(prosent_tid_sammenhengende,4)
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
            "time": t_arr[a,b,c,d],
            "t_prosent": t_prosent_arr[a,b,c,d],
            "t_prosent_sammenhengende" : t_prosent_arr_sammenhengende[a,b,c,d]
        })

    df = pd.DataFrame(data)
    df.to_csv("/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/data/Proc-opt/DEMON_avg_SNR.csv", index=False)
    print(f"SNR_vals: {SNR_vals}")
    print("DONE!")

if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()  # spesielt for Windows, men har ingen bivirkninger på macOS
    main()
