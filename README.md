# Hydrophonic Tripwire Detection

**An automatic real-time system for signal processing, visualization, and data collection of hydroacoustic and AIS data during detection of hydroacoustic events**

---

## 📚 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Requirements](#requirements)
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
Should be installed when installing the python "sounddevice" wrapper library (however, you need not install it here as its included in the requirement.txt, but is included for the sake of completeness):
```bash
pip install sounddevice
```

##### Verify
Verify the installation using this python code in REPL or in your own script (should be done after installing from requirement.txt:
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

## ⚙️ Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hydrophonic-tripwire.git
cd hydrophonic-tripwire

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up frontend
cd frontend/
npm install
