# Spectrogrammer 

![example workflow](https://github.com/Navodplayer1/spectrogrammer/actions/workflows/main.yaml/badge.svg)

spectrogrammer is a library that provide ease to developers to extract spectrograms from their wav files.

example:

```
from spectrogrammer import get_spectrogram, plot_spectrogram
import numpy as np
import matplotlib.pyplot as plt

spectrogram = get_spectrogram("audio.wav")

plot_spectrogram(spectrogram)

```