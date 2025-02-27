#!/bin/bash

HOST_INFO_FILE="broker_info.json"
if [ ! -f "$HOST_INFO_FILE" ]; then
    echo "broker_info.json not found. Creating file..."
    touch "$HOST_INFO_FILE"
fi

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

BROKER_PORT="9092"

echo "Private IP address of the host: $PRIVATE_IP"
echo "Updating Kafka configuration..."

if grep -q "^listeners=" config/server.properties; then
    sed -i "s|^listeners=.*|listeners=PLAINTEXT://0.0.0.0:$BROKER_PORT|" config/server.properties
    sed -i "s|^advertised.listeners=.*|advertised.listeners=PLAINTEXT://$PRIVATE_IP:$BROKER_PORT|" config/server.properties
else
    sed -i "s|#listeners=.*|listeners=PLAINTEXT://0.0.0.0:$BROKER_PORT|" config/server.properties
    sed -i "s|#advertised.listeners=.*|advertised.listeners=PLAINTEXT://$PRIVATE_IP:$BROKER_PORT|" config/server.properties
fi

# Create the topic for audio-data
bin/kafka-topics.sh --create --topic audio-stream --bootstrap-server $PRIVATE_IP:$BROKER_PORT --partitions 1 --replication-factor 1


# Exit the kafka directory
cd ..

# Write to JSON file
HOST_INFO_FILE="broker_info.json"
echo "{
    \"ip\": \"$PRIVATE_IP\",
    \"brokerPort\": \"$BROKER_PORT\"
}" > $HOST_INFO_FILE

echo "Configuration updated and saved to $HOST_INFO_FILE"
