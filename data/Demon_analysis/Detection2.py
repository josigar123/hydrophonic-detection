import numpy as np
import scipy.signal as signal
import librosa
import librosa.display
import matplotlib.pyplot as plt

from DemonAnalysis3 import demon_analysis
from BroadBandAnalysis import broadband_analysis
from NarrowBandAnalysis2 import narrowband_analysis

def detection(folder, selfiles=[0]):
    # Parameters
    pars = {
        "AnalysisWindowwidth": 1,  # Analysis window in seconds
        "NoiseWindow": [0, 1],  # Background noise estimation window in seconds
        "broadband": {
            "FrequencyWindow": [[100, 1000], [500, 5000], [100, 10000]],  # Frequency windows in Hz
            "order": 4
        },
        "DEMON": {
            "fsd": 200, "bandpass": {"f_low": 100, "order": 4},
            "N": 15, "NumLines": 5, "minfreq": 0, "maxfreq": 100
        },
        "spectrogram": {
            "N": 32 * 1024, "N_d": 990  # Spectrogram parameters
        },
        "narrowband": {
            "N": 50, "minfreq": 50, "maxfreq": 1000, "NumLines": 5
        },
    }

    # Load files from folder
    files = librosa.util.find_files(folder)
    
    for fileno in selfiles:
        # Load data
        data, Fs = librosa.load(files[fileno], sr=None)
        t = np.arange(len(data)) / Fs

        # Spectrogram parameters
        pars["LOFAR"] = {"N": Fs * 4}

        # Noise window
        noiseels = (t >= pars["NoiseWindow"][0]) & (t <= pars["NoiseWindow"][1])
        noise_data = data[noiseels]

        # Initialize results
        BBsignal = []
        t2 = []

        # Loop over analysis windows
        for k in range(2, int(max(t) / pars["AnalysisWindowwidth"])):
            progress = k / (max(t) / pars["AnalysisWindowwidth"])
            print(f"Progress: {progress:.2%}")

            # Analysis window
            anels = (t >= pars["NoiseWindow"][0] + (k-1) * pars["AnalysisWindowwidth"]) & \
                    (t <= pars["NoiseWindow"][1] + (k-1) * pars["AnalysisWindowwidth"])
            analysis_data = data[anels]

            t2.append(np.mean(t[anels]))

            # Broadband detection
            BBsignal.append(broadband_analysis(analysis_data, noise_data, Fs, pars))

        # Narrowband detection
        f, tr, sr = signal.spectrogram(data, Fs, nperseg=pars["LOFAR"]["N"], noverlap=pars["LOFAR"]["N"]//2, 
                                       nfft=int((pars["narrowband"]["maxfreq"] - pars["narrowband"]["minfreq"]) / (1/(pars["LOFAR"]["N"]/Fs))), 
                                       scaling='density')
        NBnorm = abs(sr) ** 2 / signal.medfilt(abs(sr) ** 2, kernel_size=(pars["narrowband"]["N"], 1))

        NBfreq = []
        NBSNR = []
        for k in range(len(tr)):
            sorted_indices = np.argsort(NBnorm[:, k])
            NBfreq.append(sorted(f[sorted_indices[-pars["narrowband"]["NumLines"]:]]))
            NBSNR.append(10 * np.log10(NBnorm[sorted_indices[-pars["narrowband"]["NumLines"]:], k]))

        # DEMON detection
        sd, td, fd = demon_analysis(data, Fs, pars)
        DEnorm = abs(sd) ** 2 / signal.medfilt(abs(sd) ** 2, kernel_size=(pars["DEMON"]["N"], 1))

        DEfreq = []
        DESNR = []
        for k in range(len(td)):
            sorted_indices = np.argsort(DEnorm[:, k])
            DEfreq.append(sorted(fd[sorted_indices[-pars["DEMON"]["NumLines"]:]]))
            DESNR.append(10 * np.log10(DEnorm[sorted_indices[-pars["DEMON"]["NumLines"]:], k]))

        # Plot results
        fig, axes = plt.subplots(3, 2, figsize=(12, 10))

        axes[0, 0].plot(t, data)
        axes[0, 0].set_xlabel("Time [s]")
        axes[0, 0].set_ylabel("Amplitude")
        axes[0, 0].grid(True)

        axes[0, 1].plot(t2, BBsignal)
        axes[0, 1].set_xlabel("Time [s]")
        axes[0, 1].set_ylabel("BBnorm")
        axes[0, 1].legend([f"{f1} - {f2} Hz" for f1, f2 in pars["broadband"]["FrequencyWindow"]])
        axes[0, 1].grid(True)

        axes[1, 0].plot(tr, NBSNR, ".")
        axes[1, 0].set_xlabel("Time [s]")
        axes[1, 0].set_ylabel("NBnorm")
        axes[1, 0].grid(True)

        axes[1, 1].plot(td, DESNR, ".")
        axes[1, 1].set_xlabel("Time [s]")
        axes[1, 1].set_ylabel("DEMON norm")
        axes[1, 1].grid(True)

        im1 = axes[2, 0].imshow(10 * np.log10(NBnorm), aspect="auto", origin="lower",
                                extent=[tr[0], tr[-1], pars["narrowband"]["minfreq"], pars["narrowband"]["maxfreq"]],
                                vmin=0, vmax=20)
        plt.colorbar(im1, ax=axes[2, 0])
        axes[2, 0].plot(tr, NBfreq, "w.", markersize=3)
        axes[2, 0].set_xlabel("Time (s)")
        axes[2, 0].set_ylabel("Frequency [Hz]")

        im2 = axes[2, 1].imshow(10 * np.log10(DEnorm), aspect="auto", origin="lower",
                                extent=[td[0], td[-1], pars["DEMON"]["minfreq"], pars["DEMON"]["maxfreq"]],
                                vmin=0, vmax=20)
        plt.colorbar(im2, ax=axes[2, 1])
        axes[2, 1].plot(td, DEfreq, "w.", markersize=3)
        axes[2, 1].set_xlabel("Time (s)")
        axes[2, 1].set_ylabel("Demon Frequency [Hz]")

        plt.tight_layout()
        plt.show()
