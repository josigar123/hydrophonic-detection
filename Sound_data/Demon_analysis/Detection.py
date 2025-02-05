import numpy as np
import scipy.signal as signal
import matplotlib.pyplot as plt
import librosa
import librosa.display

from DemonAnalysis3 import demon_analysis
from BroadBandAnalysis import broadband_analysis
from NarrowBandAnalysis2 import narrowband_analysis

# Parameters
pars = {
    "AnalysisWindowwidth": 1,  # Window width in seconds
    "NoiseWindow": [0, 1],  # Background noise estimate in seconds
    "broadband": {
        "FrequencyWindow": [[100, 1000], [500, 5000], [100, 10000]],
        "order": 4,
    },
    "DEMON": {
        "fsd": 200,
        "bandpass": {"f_low": 100, "order": 4},
        "N": 15,
        "NumLines": 5,
        "minfreq": 0,
        "maxfreq": 200,
    },
    "spectrogram": {
        "N": 32 * 1024,
        "N_d": 990,
    },
    "narrowband": {
        "N": 51,
        "minfreq": 50,
        "maxfreq": 1000,
        "NumLines": 5,
    },
}

# Load audio file
file_path = "Sound_data/001029.wav"  # Replace with actual file path
data, Fs = librosa.load(file_path, sr=None)

t = np.arange(len(data)) / Fs  # Time vector
pars["LOFAR_N"] = Fs * 4  # Spectrogram parameter

# Noise window
noiseels = (t >= pars["NoiseWindow"][0]) & (t <= pars["NoiseWindow"][1])
noise_data = data[noiseels]

# Analysis windows
BBsignal = []
t2 = []

for k in range(2, int(max(t) / pars["AnalysisWindowwidth"])):
    anels = (t >= (pars["NoiseWindow"][0] + (k - 1) * pars["AnalysisWindowwidth"])) & \
            (t <= (pars["NoiseWindow"][1] + (k - 1) * pars["AnalysisWindowwidth"]))
    t2.append(np.mean(t[anels]))

    # Broadband detection
    BBsignal.append(broadband_analysis(data[anels], noise_data, Fs, pars))

# Narrowband detection
frequencies, times, Sxx = signal.spectrogram(data, Fs, nperseg=pars["LOFAR_N"], noverlap=pars["LOFAR_N"] // 2)
NBnorm = np.abs(Sxx) ** 2 / signal.medfilt(np.abs(Sxx) ** 2, kernel_size=[pars["narrowband"]["N"], 1])

NBfreq = []
NBSNR = []

for k in range(len(times)):
    sorted_indices = np.argsort(NBnorm[:, k])
    NBfreq.append(np.sort(frequencies[sorted_indices[-pars["narrowband"]["NumLines"]:]]))
    NBSNR.append(10 * np.log10(NBnorm[sorted_indices[-pars["narrowband"]["NumLines"]:], k]))

NBfreq = np.array(NBfreq)
NBSNR = np.array(NBSNR)

# DEMON detection
sd, td, fd = demon_analysis(data, Fs, pars)
DEnorm = np.abs(sd) ** 2 / signal.medfilt(np.abs(sd) ** 2, kernel_size=[pars["DEMON"]["N"], 1])

DEfreq = []
DESNR = []

for k in range(len(td)):
    sorted_indices = np.argsort(DEnorm[:, k])
    DEfreq.append(np.sort(fd[sorted_indices[-pars["DEMON"]["NumLines"]:]]))
    DESNR.append(10 * np.log10(DEnorm[sorted_indices[-pars["DEMON"]["NumLines"]:], k]))

DEfreq = np.array(DEfreq)
DESNR = np.array(DESNR)

# Plot results
plt.figure(figsize=(12, 8))

plt.subplot(3, 2, 1)
plt.plot(t, data)
plt.xlabel("Time [s]")
plt.ylabel("Amplitude")
plt.grid()

plt.subplot(3, 2, 2)
plt.plot(t2, BBsignal)
plt.xlabel("Time [s]")
plt.ylabel("BBnorm")
plt.grid()
plt.legend([f"{fw[0]}-{fw[1]} Hz" for fw in pars["broadband"]["FrequencyWindow"]])

plt.subplot(3, 2, 3)
plt.plot(times, NBSNR, ".")
plt.xlabel("Time [s]")
plt.ylabel("NBnorm")
plt.grid()

plt.subplot(3, 2, 4)
plt.plot(td, DESNR, ".")
plt.xlabel("Time [s]")
plt.ylabel("DEMON norm")
plt.grid()

plt.subplot(3, 2, 5)
plt.imshow(10 * np.log10(NBnorm), aspect="auto", origin="lower", extent=[times.min(), times.max(), frequencies.min(), 1e3],vmin=-20,vmax=20)
plt.colorbar()
plt.xlabel("Time [s]")
plt.ylabel("Frequency [Hz]")


plt.subplot(3, 2, 6)
plt.imshow(10 * np.log10(DEnorm), aspect="auto", origin="lower", extent=[td.min(), td.max(), fd.min(), fd.max()],vmin=0,vmax=20)
plt.colorbar()
plt.xlabel("Time [s]")
plt.ylabel("Demon Frequency [Hz]")


plt.tight_layout()
plt.show()

