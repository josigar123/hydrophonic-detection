#!/bin/bash

echo "Stopping Kafka Broker..."
KAFKA_PID=$(ps aux | grep '[k]afka.Kafka' | awk '{print $2}')
if [ -n "$KAFKA_PID" ]; then
    kill -SIGTERM $KAFKA_PID
    echo "Waiting for Kafka to stop..."
    sleep 5  # Allow time for a graceful shutdown
else
    echo "Kafka is not running."
fi

echo "Stopping ZooKeeper..."
ZOOKEEPER_PID=$(ps aux | grep '[q]uorum.QuorumPeerMain' | awk '{print $2}')
if [ -n "$ZOOKEEPER_PID" ]; then
    kill -SIGTERM $ZOOKEEPER_PID
    echo "Waiting for ZooKeeper to stop..."
    sleep 5
else
    echo "ZooKeeper is not running."
fi

echo "Kafka and ZooKeeper have been stopped."

echo "Deleting kafka installation"
/bin/rm -rf "kafka_2.13-3.9.0

echo "Removing tmp files"
/bin/rm -rf /tmp/kafka-logs /tmp/zookeeper /tmp/kraft-combined-logs