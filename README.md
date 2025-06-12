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

After installation
```bash
nvm install lts
nvm use lts

# Verify installation
node -v     # Check Node.js version
npm -v      # Check npm version

```

### Python Packages

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
