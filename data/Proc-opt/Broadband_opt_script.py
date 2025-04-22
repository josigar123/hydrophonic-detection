import numpy as np
import matplotlib.pyplot as plt
import scipy.signal as signal
from time import perf_counter

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
import functions  # din modul
from mpl_toolkits.mplot3d import Axes3D
import pandas as pd

#--------------------------------------------------------------------------------------------------
#Color generator
import colorsys

def generate_vivid_colors(x):
    """
    Generate x vivid and distinct RGB colors using evenly spaced hues in HSV.
    
    Args:
        x (int): Number of colors
    
    Returns:
        List of RGB tuples (r, g, b) with values in [0, 1]
    """
    colors = []
    for i in range(x):
        hue = i / x
        rgb = colorsys.hsv_to_rgb(hue, 1.0, 1.0)  # Full saturation & brightness
        colors.append(rgb)
    return colors
#--------------------------------------------------------------------------------------------------
def compute_BB(i, j, sx, fs, window_size, hilbert_win):
    win_size = window_size * (i + 1)
    hilb_win = hilbert_win * (j + 1)
    sx_buff = []
    BB_t0 = perf_counter()
    BB, BB_t, sx_buff = functions.BB_data(sx, fs, sx_buff, hilb_win, win_size)
    BB = BB - BB.min()
    BB_t1 = perf_counter()
    time = (BB_t1 - BB_t0)
    print(f"Calculation time with window_size = {win_size} and Hilbert_win = {hilb_win} t = {time:.2f}[s]")
    return j, i, BB.max(), BB_t, BB, time


def main():
    Audio_path = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/torrtst2.wav"

    fs = 10_000
    hilbert_win = 10
    window_size = 2
    num_window_iterations = 20
    num_hilbert_iterations = 4
    tot_time = 0

    colors = generate_vivid_colors(num_window_iterations * num_hilbert_iterations)
    sx, fs = functions.load_audiofile(Audio_path, fs, fc_low=5)

    Max_SNR = np.zeros((num_hilbert_iterations, num_window_iterations))
    bar_window_ax = np.linspace(window_size, window_size * num_window_iterations, num_window_iterations)
    bar_hilb_ax = np.linspace(hilbert_win, hilbert_win * num_hilbert_iterations, num_hilbert_iterations)

    fig = plt.figure(figsize=(16, 4))

    All_BB = []
    with ProcessPoolExecutor() as executor:
        futures = [executor.submit(compute_BB, i, j, sx, fs, window_size, hilbert_win)
                   for i in range(num_window_iterations)
                   for j in range(num_hilbert_iterations)]

        for future in futures:
            j, i, snr_max, BB_t, BB, time = future.result()
            Max_SNR[j][i] = snr_max
            tot_time += time
            #Lagrer BB plot i csv
            for ti, BBi in zip(BB_t,BB):
                All_BB.append({
                    "t": ti,
                    "BB": BBi,
                    "plot_id" : f"Win_{window_size*(i+1)}/Hilb_{hilbert_win*(j+1)}"
                })


    # 2D og 3D plotting fortsetter her...

    # Finn beste SNR
    best_index = np.unravel_index(np.argmax(Max_SNR), Max_SNR.shape)
    best_snr = Max_SNR[best_index]

    # Midlertidig sett beste verdi til noe veldig lavt for å finne neste beste
    Max_SNR_temp = Max_SNR.copy()
    Max_SNR_temp[best_index] = -np.inf

    second_index = np.unravel_index(np.argmax(Max_SNR_temp), Max_SNR.shape)
    second_best_snr = Max_SNR[second_index]

    # Print resultater
    print("\n------------------------------")
    print(f"Best SNR     : {best_snr:.6f}")
    print(f"window_size  : {(best_index[1]+1) * window_size}")
    print(f"hilbert_win  : {(best_index[0]+1) * hilbert_win}")
    print("------------------------------")
    print(f"Second Best SNR : {second_best_snr:.6f}")
    print(f"window_size     : {(second_index[1]+1) * window_size}")
    print(f"hilbert_win     : {(second_index[0]+1) * hilbert_win}")
    print("------------------------------")
    print(f"Total processing time : {tot_time:.2f}")
    print("------------------------------")

    


    # Lag en DataFrame fra Max_SNR
    df_snr = pd.DataFrame(
        Max_SNR,
        index=[f"hilbert_{hilbert_win * i}" for i in range(1, num_hilbert_iterations + 1)],
        columns=[f"window_{window_size * i}" for i in range(1, num_window_iterations + 1)]
    )
    df_BB = pd.DataFrame(All_BB)

    # Lagre til CSV
    df_snr.to_csv("/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/data/Proc-opt/broadband_max_snr_matrix.csv")
    df_BB.to_csv("/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/data/Proc-opt/broadband_plot_list.csv")
    print("------------------------------")
    print("Prosessering fullført!")
    print("Max_SNR datasett overført til `broadband_max_snr_matrix.csv` ")
    print("Broadband datasett overført til `broadband_plot_list.csv` ")
    print("------------------------------")


if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()  # spesielt for Windows, men har ingen bivirkninger på macOS
    main()
