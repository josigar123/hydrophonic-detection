#!/bin/bash

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_FAMILY=$ID_LIKE
elif [ -f /etc/lsb-release ]; then
    . /etc/lsb-release
    OS=$DISTRIB_ID
elif [[ "$(uname -s)" == "Darwin" ]]; then
    OS="macos"
else
    OS=$(uname -s)
fi

echo "Detected OS: $OS"

if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    PKG_MANAGER="sudo apt"
    JAVA_PACKAGE="openjdk-11-jdk"
    WGET_PACKAGE="wget"
    UPDATE_CMD="$PKG_MANAGER update"
elif [[ "$OS" == "arch" || "$OS_FAMILY" == *"arch"* ]]; then
    PKG_MANAGER="sudo pacman -Sy --noconfirm"
    JAVA_PACKAGE="jdk11-openjdk"
    WGET_PACKAGE="wget"
elif [[ "$OS" == "fedora" || "$OS" == "rhel" || "$OS" == "centos" || "$OS_FAMILY" == *"rhel"* ]]; then
    PKG_MANAGER="sudo dnf install -y"
    JAVA_PACKAGE="java-11-openjdk-devel"
    WGET_PACKAGE="wget"
elif [[ "$OS" == "opensuse" || "$OS" == "suse" ]]; then
    PKG_MANAGER="sudo zypper install -y"
    JAVA_PACKAGE="java-11-openjdk-devel"
    WGET_PACKAGE="wget"
elif [[ "$OS" == "macos" ]]; then
    PKG_MANAGER="brew install"
    JAVA_PACKAGE="openjdk@11"
    WGET_PACKAGE="wget"
    if ! command -v brew &>/dev/null; then
        echo "Homebrew not found. Installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
else
    echo "Unsupported OS: $OS"
    echo "Please install Java 11 JDK and wget manually."
    exit 1
fi

if ! command -v java &>/dev/null; then
    echo "Installing OpenJDK 11..."
    $PKG_MANAGER $JAVA_PACKAGE
else
    echo "OpenJDK 11 is already installed."
fi

if ! command -v wget &>/dev/null; then
    echo "Installing wget..."
    $PKG_MANAGER $WGET_PACKAGE
else
    echo "wget is already installed."
fi

if [ ! -f kafka_2.13-3.9.0.tgz ]; then
    echo "Downloading Kafka..."
    wget https://dlcdn.apache.org/kafka/3.9.0/kafka_2.13-3.9.0.tgz
else
    echo "Kafka is already downloaded."
fi

ZOOKEEPER_DIR="/tmp/zookeeper"
if [ -d "$ZOOKEEPER_DIR" ]; then
    echo "Cleaning up ZooKeeper data..."
    sudo rm -rf $ZOOKEEPER_DIR/*
else
    echo "No existing ZooKeeper data found."
fi

KAFKA_LOG_DIR="/tmp/kraft-combined-logs"
if [ -d "$KAFKA_LOG_DIR" ]; then
    echo "Cleaning up Kafka log data..."
    sudo rm -rf $KAFKA_LOG_DIR/*
else
    echo "No existing Kafka log data found."
fi

if [ ! -d "kafka_2.13-3.9.0" ]; then
    echo "Extracting Kafka..."
    tar -xzf kafka_2.13-3.9.0.tgz
else
    echo "Kafka is already extracted."
fi

rm -rf kafka_2.13-3.9.0.tgz
