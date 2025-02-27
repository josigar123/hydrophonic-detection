from kafka import KafkaConsumer

consumer = KafkaConsumer(
                         bootstrap_servers=['localhost:9092'],
                         auto_offset_reset='earliest',
                         enable_auto_commit=False,
                         )

consumer.subscribe(topics=["quickstart-events"])

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