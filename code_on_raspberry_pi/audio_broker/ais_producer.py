import json
import time
from kafka import KafkaProducer
import pyais
from pyais.stream import TCPConnection 

with open("broker_info_ais.json", "r") as file:
    broker_info = json.load(file)


broker_ip = broker_info["ip"]
broker_port = broker_info ["brokerPort"]
topic = broker_info["topicName"]
ais_host = broker_info["aisHost"]
ais_port = int(broker_info["aisPort"])
batch_size = 10
send_interval = 5

print("##############PRODUCER SETUP##############")
print(f"Connecting to Kafka broker: {broker_ip}:{broker_port}")
print(f"Sending to topic: {topic}")
print(f"AIS source: {ais_host}:{ais_port}")


producer = KafkaProducer(
    bootstrap_servers=[f"{broker_ip}:{broker_port}"],
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

try:
    ais_stream = TCPConnection(host=ais_host, port=ais_port)
    print("Connected to AIS data source")
    print("##############SETUP END##############")

    message_batch = []
    last_send_time = time.time()

    for msg in ais_stream:
        try:
            decoded = msg.decode()
            print(f"Decoded message type: {type(decoded).__name__}")

            ais_data = {
                "timestamp": time.time(),
                "message_type": decoded.msg_type,
                "mmsi": decoded.mmsi,
                "raw_message": str(msg)
            }

            if decoded.msg_type in [1, 2, 3, 18, 19]:
                print("Position report message detected")
                ais_data.update({
                    "latitude": decoded.lat,
                    "longitude": decoded.lon,
                    "course": decoded.course,
                    "speed": decoded.speed,
                    "heading": decoded.heading
                })
            elif decoded.msg_type == 5:
                print("Static and voyage data message detected")
                ais_data.update({
                    "mmsi": decoded.mmsi,
                    "callsign": decoded.callsign,
                    "name": decoded.name if hasattr(decoded, "name") else " ",
                    "ship_type": decoded.ship_type,
                    "destination": decoded.destination
                })


            message_batch.append(ais_data)

            current_time = time.time()
            if len(message_batch) >= batch_size or (current_time - last_send_time) >= send_interval:
                if message_batch: 
                    for message in message_batch:
                        producer.send (topic, value=message)

                    print(f"Sent {len(message_batch)} messages to Kafka broker")
                    message_batch = []
                    last_send_time = current_time

                    producer.flush()
        except Exception as e:
            print(f"Error processing AIS message: {e}")
except Exception as e: 
    print(f"Error connecting to AIS data source {e}")

finally:
    print("Stopping Kafka producer...")
    if "producer" in locals():
        producer.flush()
        producer.close()
    print("Stopped producer")