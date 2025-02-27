from kafka import KafkaConsumer

import json

with open("broker_info.json", "r") as file:
    broker_info = json.load(file)

broker_ip = broker_info["ip"]
broker_port = broker_info["brokerPort"]
broker_topic = broker_info["topicName"]

consumer = KafkaConsumer(
    broker_topic,
    bootstrap_servers=[f"{broker_ip}:{broker_port}"],
    auto_offset_reset='earliest',
    enable_auto_commit=True
)

for message in consumer:
    print(f"Received message with offset {message.offset}")
    
    wav_data = message.value
    print(f"Received WAV data size: {len(wav_data)} bytes")
