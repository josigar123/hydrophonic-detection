# 📡 BroadbandOptimization

Et C++-program for bredbåndsanalyse og signalbehandling, med støtte for FFT og lydfilbehandling via FFTW og libsndfile.

## 🔧 Bygget med

- CMake (>= 3.16)
- C++17
- [FFTW](http://www.fftw.org/)
- [libsndfile](http://www.mega-nerd.com/libsndfile/)

---

## 📦 Avhengigheter

Installer med [Homebrew](https://brew.sh/):

```bash
brew install cmake fftw libsndfile
```

---

## 🛠️ Bygg prosjektet

```bash
git clone https://github.com/dittnavn/BroadbandOptimization.git
cd BroadbandOptimization
mkdir build
cd build
cmake ..
make
```

---

## ▶️ Kjør programmet

```bash
./Broadband_opt
```

---

## 📁 Prosjektstruktur

```
BroadbandOptimization/
├── Broadband_opt.cpp        # Hovedprogram
├── functions.cpp            # Signalprosessering og hjelpefunksjoner
├── functions.h              # Funksjonsdeklarasjoner
├── CMakeLists.txt           # Byggeoppskrift
└── build/                   # Kompilerte filer og binær
```

---

## 📤 Output

Programmet skriver ut:

- Beste og nest beste SNR-verdier for ulike Hilbert- og vindustørrelser.
- En CSV-fil med SNR-matrisen:  
  `data/Proc-opt/broadband_max_snr_matrix_c.csv`

---

## 📞 Kontakt

Utviklet av [Ditt Navn](mailto:ditt.epost@eksempel.no).  
Laget som del av [Hydrophonic Detection](https://github.com/dittrepo/hydrophonic-detection).