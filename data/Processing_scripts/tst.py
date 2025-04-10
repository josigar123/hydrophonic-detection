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

import numpy as np
import matplotlib.pyplot as plt
from concurrent.futures import ProcessPoolExecutor
from time import perf_counter
from functools import partial
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.cm as cm
import functions

Audio_path = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/001029.wav"
fs = 10_000
hilbert_win = 5
window_size = 2
num_window_iterations = 25
num_hilbert_iterations = 5

colors = generate_vivid_colors(num_window_iterations * num_hilbert_iterations)

sx, fs = functions.load_audiofile(Audio_path, fs, fc_low=5)

bar_window_ax = np.linspace(window_size, window_size * num_window_iterations, num_window_iterations)
bar_hilb_ax = np.linspace(hilbert_win, hilbert_win * num_hilbert_iterations, num_hilbert_iterations)
Max_SNR = np.zeros((num_hilbert_iterations, num_window_iterations))

# -------- FUNKSJON TIL PARALLELL KJØRING --------
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

# -------- PARALLELL BEREGNING --------
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

# -------- 2D HISTOGRAM --------
plt.figure(figsize=(16, 4))
plt.bar(bar_window_ax, Max_SNR[0], color=colors)
plt.xlabel("window_size[s]")
plt.ylabel("SNR")
plt.ylim((np.min(Max_SNR) - 2, np.max(Max_SNR) + 1))
plt.grid()

# -------- 3D PLOT --------
x_pos, y_pos = np.meshgrid(bar_window_ax, bar_hilb_ax, indexing='xy')
x_pos = x_pos.ravel()
y_pos = y_pos.ravel()
dz = Max_SNR.ravel()
zlim_min = dz.min() * 0.9
zlim_max = dz.max() * 1.05
dz_scaled = dz - zlim_min
z_pos = np.full_like(x_pos, zlim_min)
dx = dy = 0.8
norm_dz = (dz - dz.min()) / (dz.max() - dz.min())
colors3d = cm.viridis(norm_dz)

fig3d = plt.figure(figsize=(16, 4))
ax = fig3d.add_subplot(111, projection='3d')
ax.bar3d(x_pos - dx / 2, y_pos - dy / 2, z_pos, dx, dy, dz_scaled, color=colors3d, shade=True)

ax.set_xlabel('Window_size')
ax.set_ylabel('Hilbert_win')
ax.set_zlabel('SNR')
ax.set_title('3D Bar Plot from Grid Data')
ax.set_zlim(zlim_min, zlim_max)
ax.set_xticks(np.unique(x_pos))
ax.set_yticks(np.unique(y_pos))

plt.show()

# -------- FINN BESTE SNR --------
max_index = np.unravel_index(np.argmax(Max_SNR), Max_SNR.shape)
print("\n------------------------------")
print(f"Best SNR : {Max_SNR.max()}")
print(f"window_size : {max_index[1]*window_size}")
print(f"hilbert_win : {max_index[0]*hilbert_win}")
print("------------------------------")
