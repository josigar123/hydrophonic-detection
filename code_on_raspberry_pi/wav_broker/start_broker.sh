#!/bin/bash

cd kafka_2.13-3.9.0

echo "Starting ZooKeeper..."
bin/zookeeper-server-start.sh -daemon config/zookeeper.properties
echo "Waiting for ZooKeeper to start..."
sleep 5
echo "Starting Kafka..."
bin/kafka-server-start.sh config/server.properties