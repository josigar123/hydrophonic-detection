#!/bin/bash

if ! dpkg -l | grep -q openjdk-11-jdk; then
    echo "Installing OpenJDK 11..."
    sudo apt update
    sudo apt install -y openjdk-11-jdk
else
    echo "OpenJDK 11 is already installed."
fi

if ! dpkg -l | grep -q wget; then
    echo "Installing wget..."
    sudo apt install -y wget
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

cd kafka_2.13-3.9.0

PRIVATE_IP=$(hostname -I | awk '{print $1}')
echo "Private IP address of the host: $PRIVATE_IP"

echo "Updating Kafka configuration..."
sed -i "s/^listeners=PLAINTEXT:\/\/0.0.0.0:9092/listeners=PLAINTEXT:\/\/$PRIVATE_IP:9092/" config/server.properties
sed -i "s/^advertised.listeners=PLAINTEXT:\/\/your_public_ip:9092/advertised.listeners=PLAINTEXT:\/\/$PRIVATE_IP:9092/" config/server.properties

echo "Starting ZooKeeper..."
bin/zookeeper-server-start.sh config/zookeeper.properties &

echo "Starting Kafka..."
bin/kafka-server-start.sh config/server.properties
