from kafka import KafkaConsumer
import time

# Define broker and topic
broker_ip = '10.0.0.13:9092'
topic = 'quickstart-events'

# Add debugging
print(f"Starting consumer for broker {broker_ip} and topic {topic}")

# Set a specific consumer group ID
consumer_group = "my-test-consumer-group"

try:
    # Create consumer with simpler configuration first
    print("Creating consumer...")
    consumer = KafkaConsumer(
        bootstrap_servers=[broker_ip],
        auto_offset_reset='earliest',
        enable_auto_commit=True,  # Change to True for troubleshooting
        session_timeout_ms=10000,  # Increase timeout
        request_timeout_ms=15000,  # Increase request timeout
        consumer_timeout_ms=10000  # Add consumer timeout
    )
    
    print("Subscribing to topic...")
    consumer.subscribe([topic])
    print(f"Subscribed to topic: {topic}")
    
    # Print available topics for debugging
    available_topics = consumer.topics()
    print(f"Available topics: {available_topics}")
    
    print("Starting polling loop...")
    # Add a timeout to the main loop
    end_time = time.time() + 60  # Run for 60 seconds max
    
    while time.time() < end_time:
        print("Polling for messages...")
        # Use a smaller timeout for polling
        message_batch = consumer.poll(timeout_ms=1000)
        print(f"Poll returned: {len(message_batch) if message_batch else 0} partitions with messages")
        
        if message_batch:
            for tp, messages in message_batch.items():
                for message in messages:
                    print(f"Received: {message.value.decode('utf-8')}")
        else:
            print("No messages received")
        
        # Add small delay to prevent CPU spinning
        time.sleep(1)
        
    print("Consumer loop finished")
    
except Exception as e:
    print(f"Error in Kafka consumer: {e}")
finally:
    # Always close the consumer
    try:
        consumer.close()
        print("Consumer closed properly")
    except:
        print("Error closing consumer")