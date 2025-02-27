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

cd kafka_2.13-3.9.0

if [[ "$OS" == "arch" || "$OS_FAMILY" == *"arch"* ]]; then
    PRIVATE_IP=$(ip -4 addr show | grep -v '127.0.0.1' | grep -oP 'inet \K[\d.]+')
else
    PRIVATE_IP=$(hostname -I | awk '{print $1}')
fi

echo "Private IP address of the host: $PRIVATE_IP"
echo "Updating Kafka configuration..."

if grep -q "^listeners=" config/server.properties; then
    sed -i "s|^listeners=.*|listeners=PLAINTEXT://0.0.0.0:9092|" config/server.properties
    sed -i "s|^advertised.listeners=.*|advertised.listeners=PLAINTEXT://$PRIVATE_IP:9092|" config/server.properties
else
    sed -i "s|#listeners=.*|listeners=PLAINTEXT://0.0.0.0:9092|" config/server.properties
    sed -i "s|#advertised.listeners=.*|advertised.listeners=PLAINTEXT://$PRIVATE_IP:9092|" config/server.properties
fi