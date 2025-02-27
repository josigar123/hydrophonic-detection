from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers=["10.0.0.13:9092"]
)

producer.send("quickstart-events", value="Hello, World!".encode("utf-8"))