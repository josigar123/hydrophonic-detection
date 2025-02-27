from kafka import KafkaConsumer

# Define broker and topic
broker_ip = '10.0.0.13:9092'
topic = 'quickstart-events'

# Attempt to create a consumer
try:
    consumer = KafkaConsumer(
        bootstrap_servers=[broker_ip],
        auto_offset_reset='earliest',
        enable_auto_commit=False,
    )

    consumer.subscribe([topic])

    while True:
        msg = consumer.poll(timeout_ms=1000)
        if msg:
            for topic_partition, messages in msg.items():
                for message in messages:
                    print("Topic: {} | Partition: {} | Offset: {} | Key: {} | Value: {}".format(
                        topic_partition.topic, topic_partition.partition, message.offset, message.key, message.value.decode("utf-8")
                    ))
        else:
            print("No new messages")
except Exception as e:
    print(f"Error connecting to the Kafka broker at {broker_ip}: {e}")
