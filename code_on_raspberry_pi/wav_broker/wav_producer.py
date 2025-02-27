from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers=["localhost:9092"]
)

producer.send("quickstart-events", value="Hello, World!".encode("utf-8"))