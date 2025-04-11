import numpy as np
import matplotlib.pyplot as plt
from concurrent.futures import ProcessPoolExecutor
from time import perf_counter
import matplotlib.cm as cm
import functions  # din modul
from mpl_toolkits.mplot3d import Axes3D

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
    print(f"Calculation time with window_size = {win_size} and Hilbert_win = {hilb_win} t = {(BB_t1 - BB_t0):.2f}[s]")
    return j, i, BB.max(), BB_t, BB


def main():
    Audio_path = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/001029.wav"

    fs = 10_000
    hilbert_win = 5
    window_size = 2
    num_window_iterations = 25
    num_hilbert_iterations = 5

    colors = generate_vivid_colors(num_window_iterations * num_hilbert_iterations)
    sx, fs = functions.load_audiofile(Audio_path, fs, fc_low=5)

    Max_SNR = np.zeros((num_hilbert_iterations, num_window_iterations))
    bar_window_ax = np.linspace(window_size, window_size * num_window_iterations, num_window_iterations)
    bar_hilb_ax = np.linspace(hilbert_win, hilbert_win * num_hilbert_iterations, num_hilbert_iterations)

    fig = plt.figure(figsize=(16, 4))

    results = []
    with ProcessPoolExecutor() as executor:
        futures = [executor.submit(compute_BB, i, j, sx, fs, window_size, hilbert_win)
                   for i in range(num_window_iterations)
                   for j in range(num_hilbert_iterations)]

        for future in futures:
            j, i, snr_max, BB_t, BB = future.result()
            Max_SNR[j][i] = snr_max
            plt.plot(BB_t, BB, color=colors[i])

    plt.xlabel("time[s]")
    plt.ylabel("SNR")
    plt.grid()

    # 2D og 3D plotting fortsetter her...

    max_index = np.unravel_index(np.argmax(Max_SNR), Max_SNR.shape)
    print("\n------------------------------")
    print(f"Best SNR : {Max_SNR.max()}")
    print(f"window_size : {max_index[1] * window_size}")
    print(f"hilbert_win : {max_index[0] * hilbert_win}")
    print("------------------------------")


if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()  # spesielt for Windows, men har ingen bivirkninger på macOS
    main()
