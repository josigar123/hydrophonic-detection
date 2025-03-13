from kafka.admin import KafkaAdminClient, NewTopic

def create_topic(broker_info, topic_name):

    admin_client = KafkaAdminClient(
        bootstrap_server=f"{broker_info["ip"]}:{broker_info["port"]}"
    )

    topic = NewTopic(topic_name, num_partitions=1, replication_factor=1)

    try:
        admin_client.create_topics(new_topics=[topic], validate_only=False)
        print(f"Topic '{topic_name} created successfully'")
    except Exception as e:
        print(f"Error creating topic '{topic_name}': {e}")