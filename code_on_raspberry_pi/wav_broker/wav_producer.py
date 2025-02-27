import time
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers=["10.0.0.13:9092"],
    value_serializer=lambda v: str(v).encode('utf-8')
)

def produce_stream():
    counter = 0
    while True:
        message = f"Message {counter}"
        producer.send("quickstart-events", value=message)
        print(f"Sent: {message}")
        counter += 1
        
        time.sleep(1)

produce_stream()
