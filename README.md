# Hydrophonic Tripwire Detection

**An automatic real-time system for signal processing, visualization, and data collection of hydroacoustic and AIS data during detection of hydroacoustic events**

---

## 📚 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Requirements](#requirements)
- [Environment](#environment)
- [Installation](#installation)
- [Usage](#usage)
- [Services](#services)
- [Development](#development)
- [License](#license)

---

## 🧠 Overview

---

## ✨ Features

---

## 🏗️ System Architecture

![System Architecture](path/to/system-architecture.png)

---

## 🧰 Requirements

### Operating System
Works fine on Windows, MacOS and Linux

### Core Dependencies

#### PortAudio
The system uses PortAudio, a cross-platform audio I/O library for real-time audio input/output, and is used with the Python sounddevice wrapper library, and MUST be installed on your system.

#### On Debian/Ubuntu:
```bash
sudo apt update
sudo apt install portaudio19-dev python3-pyaudio
```

#### On MacOS:
```bash
brew install portaudio
```
#### On Windows:
Should be installed when installing the python "sounddevice" wrapper library (however, you need not install it here as its included in the environment.yml, but is included here for the sake of completeness):
```bash
pip install sounddevice
```

##### Verify
Verify the installation using this python code in REPL or in your own script (should be done after setting up environment):
```bash
import sounddevice as sd
print(sd.query_devices())  # Lists all available audio input/output devices
```

#### Frontend
System needs to have installed the latest node version to run the frontend.

#### On Debian/Ubuntu:
```bash
sudo apt update
sudo apt install nodejs npm

# Verify installation
node -v     # Check Node.js version
npm -v      # Check npm version
```

#### On MacOS (with homebrew):
```bash
brew install node
# Verify installation
node -v     # Check Node.js version
npm -v      # Check npm version
```

#### On Windows:
Follow the installer at: https://nodejs.org/en (choose LTS)

After installation (in PowerShell)
```bash
nvm install lts
nvm use lts

# Verify installation
node -v     # Check Node.js version
npm -v      # Check npm version

```
#### Backend
The backend runs using Python, ensure that you have atleast Python 3.10+ installed on your system

#### On Debian/Ubuntu:
Should already be preinstalled on your system, check with:
```bash
python3 --version

# Install pip if necessary
sudo apt update
sudo apt install python3-pip 
```

#### On MacOS (with homebrew):
```bash
brew install python

# Verify
python3 --version
pip3 --version
```

#### On Windows:
Go to: https://www.python.org/downloads/windows/ and install the latest 64-bit version, mark the checkbox asking if you want to add Python to PATH as: YES.
Continue following the installer, then verify:
```bash
python --version
pip --version
```

### Python Packages
The relevant Python packages are listed in requirement.txt as follows:
```bash
aiokafka==0.12.0
argon2-cffi==23.1.0
argon2-cffi-bindings==21.2.0
async-timeout==5.0.1
attrs==25.3.0
bitarray==3.3.1
brotli==1.1.0
certifi==2025.1.31
dnspython==2.7.0
environs==14.1.1
fastapi-cors==0.0.6
geosphere==0.0.1
httptools==0.6.4
idna==3.10
kafka-python==2.0.5
marshmallow==3.26.1
minio==7.2.15
mutagen==1.47.0
packaging==24.2
protobuf==4.25.3
pyais==2.9.2
pyaudio==0.2.11
pycryptodome==3.22.0
pycryptodomex==3.22.0
pymongo==4.11.3
python-dotenv==1.1.0
scipy==1.15.2
six==1.17.0
sounddevice==0.5.1
uvloop==0.21.0
watchfiles==1.0.5
websockets==10.4
```
---

## Environment
It is recommended to use an isolated python environment for installing all the packages into. For this project use miniconda. This is to avoid potential version collisions.

Installing miniconda:

#### Debian/Ubuntu:
Download the installer from: https://www.anaconda.com/docs/getting-started/miniconda/main#linux-installers

Run installation script:
```bash
bash Miniconda3-latest-Linux-x86_64.sh
```

Follow installation propmts

Restart your terminal or source your shell config:
```bash
source ~/.bashrc   # or ~/.zshrc if you use zsh
```

Verify:
```bash
conda --version
```

#### MacOS:
Download the installer from: https://www.anaconda.com/docs/getting-started/miniconda/main#macos-installers

Run installation script:
```bash
bash Miniconda3-latest-MacOSX-x86_64.sh
```

Follow installation propmts

Restart your terminal or source your shell config:
```bash
source ~/.bashrc   # or ~/.zshrc if you use zsh
```

Verify:
```bash
conda --version
```

#### Windows:
Download installer from: https://www.anaconda.com/docs/getting-started/miniconda/main#windows-installers

Run the .exe and follow the GUI steps

After installation open, AnacondaPrompt, Command Promp or PowerShell and verify:
```bash
conda --version
```

---

## ⚙️ Installation

#### Download the source code
```bash
# Clone the repository to your desired location
git clone https://github.com/josigar123/hydrophonic-detection.git
cd hydrophonic-detection
```

#### Setup the backend environment
From the project root (assuming miniconda is installed on your system) run the following:
```bash
conda env create -f environment.yml # Creates an environment named "python_htd_env"
conda activate python_htd_env # Activates the environment
```
On consecutive starts of the system, you may need to activate the environment again.

# Set up frontend
From the project root move into:
```bash
cd app/frontend/spectrogram_viewer_gui/src
npm install # Installs necessary dependencies for the frontend
```
The frontend should be up and running, verify that it works by running:
```bash
npm run dev # Vites dev server
```
In the terminal you should be presented with multiple URLs, pick one and you should be redirected to the GUI.

Close down the GUI with in the terminal:
```bash
Ctrl + C
```
#### LightningchartJS
A big part of the frontend is data visualization, the library used fro spectrogram, DEMON-spectrogram and broadband analysis is LightningchartJS. Since the project is still in its development phase, their non-commercial license has been used.
This licenses must be updated each month, and on system-boot an internet connection is required for validating the key.

A license key can be fetched from:
```bash
https://lightningchart.com/non-commercial-license/
```
This can be re-used indefinitely as of writing this. You should recieve an email with a zip-attachement containing a license.txt file with some basic javascript:
```bash
const lc = lightningChart({
    license: "0002-n0i9AP8MN...",
    licenseInformation: {
        appTitle: "LightningChart JS Trial",
        company: "LightningChart Ltd."
    },
})
const chart = lc.ChartXY()


Installation instructions
https://lightningchart.com/js-charts/docs/installation
```

When updating the license key move into:
```bash
cd app/frontend/spectrogram_viewer_gui
```
And open the lightningChartLicense.json file:
```bash
{
  "license": "0002-n0i9AP8MN..."
}
```
Replace the old license key with the new one. Do not be concerned that the key is public on github, since its a free key a new one can always be fetched.
*Beware*, we have experienced recieving outdated license keys, check the date. If its outdated get a new one.
