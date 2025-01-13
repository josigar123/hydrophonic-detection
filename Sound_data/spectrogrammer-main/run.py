from spectrogrammer import get_spectrogram, plot_spectrogram
import numpy as np
import matplotlib.pyplot as plt

spectrogram = get_spectrogram("004027.wav")

plot_spectrogram(spectrogram)