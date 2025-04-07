from kafka.admin import KafkaAdminClient, NewTopic

def create_topic(broker_info, topic_name, config=None):

    try:
        admin_client = KafkaAdminClient(
            bootstrap_servers=f"{broker_info['ip']}:{broker_info['port']}"
        )
    except Exception as e:
        raise Exception(f"No broker for {broker_info['ip']}:{broker_info['port']}")
    
    
    existing_topics = admin_client.list_topics()
    if topic_name in existing_topics:
        print(f"Topic: {topic_name}, already exists, no operation taken")
        return
        
    topic = NewTopic(topic_name, num_partitions=1, replication_factor=1,
                     topic_configs=config or None)

    try:
        admin_client.create_topics(new_topics=[topic], validate_only=False)
        print(f"Topic '{topic_name} created successfully'")
    except Exception as e:
        print(f"Error creating topic '{topic_name}': {e}")
    finally:
        admin_client.close()