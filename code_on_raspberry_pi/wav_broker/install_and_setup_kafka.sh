#!/bin/bash

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_FAMILY=$ID_LIKE
elif [ -f /etc/lsb-release ]; then
    . /etc/lsb-release
    OS=$DISTRIB_ID
else
    OS=$(uname -s)
fi

echo "Detected OS: $OS"

if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    if ! dpkg -l | grep -q openjdk-11-jdk; then
        echo "Installing OpenJDK 11 on Debian/Ubuntu..."
        sudo apt update
        sudo apt install -y openjdk-11-jdk
    else
        echo "OpenJDK 11 is already installed."
    fi
    if ! dpkg -l | grep -q wget; then
        echo "Installing wget on Debian/Ubuntu..."
        sudo apt install -y wget
    else
        echo "wget is already installed."
    fi
elif [[ "$OS" == "arch" || "$OS_FAMILY" == *"arch"* ]]; then
    if ! pacman -Q jdk11-openjdk &>/dev/null; then
        echo "Installing OpenJDK 11 on Arch Linux..."
        sudo pacman -Sy --noconfirm jdk11-openjdk
    else
        echo "OpenJDK 11 is already installed."
    fi
    if ! pacman -Q wget &>/dev/null; then
        echo "Installing wget on Arch Linux..."
        sudo pacman -Sy --noconfirm wget
    else
        echo "wget is already installed."
    fi
elif [[ "$OS" == "fedora" || "$OS" == "rhel" || "$OS" == "centos" || "$OS_FAMILY" == *"rhel"* ]]; then
    if ! rpm -q java-11-openjdk-devel &>/dev/null; then
        echo "Installing OpenJDK 11 on RHEL/Fedora/CentOS..."
        sudo dnf install -y java-11-openjdk-devel
    else
        echo "OpenJDK 11 is already installed."
    fi
    if ! rpm -q wget &>/dev/null; then
        echo "Installing wget on RHEL/Fedora/CentOS..."
        sudo dnf install -y wget
    else
        echo "wget is already installed."
    fi
elif [[ "$OS" == "opensuse" || "$OS" == "suse" ]]; then
    if ! rpm -q java-11-openjdk-devel &>/dev/null; then
        echo "Installing OpenJDK 11 on openSUSE..."
        sudo zypper install -y java-11-openjdk-devel
    else
        echo "OpenJDK 11 is already installed."
    fi
    if ! rpm -q wget &>/dev/null; then
        echo "Installing wget on openSUSE..."
        sudo zypper install -y wget
    else
        echo "wget is already installed."
    fi
else
    echo "Unsupported OS: $OS"
    echo "Please install Java 11 JDK and wget manually."
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
cd kafka_2.13-3.9.0

PRIVATE_IP=$(hostname -I | awk '{print $1}')
echo "Private IP address of the host: $PRIVATE_IP"
echo "Updating Kafka configuration..."

if grep -q "^listeners=" config/server.properties; then
    sed -i "s|^listeners=.*|listeners=PLAINTEXT://0.0.0.0:9092|" config/server.properties
    sed -i "s|^advertised.listeners=.*|advertised.listeners=PLAINTEXT://$PRIVATE_IP:9092|" config/server.properties
else
    sed -i "s|#listeners=.*|listeners=PLAINTEXT://0.0.0.0:9092|" config/server.properties
    sed -i "s|#advertised.listeners=.*|advertised.listeners=PLAINTEXT://$PRIVATE_IP:9092|" config/server.properties
fi

echo "Starting ZooKeeper..."
bin/zookeeper-server-start.sh -daemon config/zookeeper.properties
echo "Waiting for ZooKeeper to start..."
sleep 5
echo "Starting Kafka..."
bin/kafka-server-start.sh config/server.properties