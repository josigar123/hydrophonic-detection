from kafka import KafkaProducer
import json

'''

    Reads from a config_file_json in the same directory that looks like this

    {
        "channels": 4,
        "sampleRate": 44100,
        "recordingChunkSize": 1024
    }

    it produces the files contents to a kafka topic

'''

def produce_audio_config(broker_info: dict, config_topic: str, recording_parameters: dict):

    config_producer = KafkaProducer(bootstrap_servers=[f"{broker_info['ip']}:{broker_info['port']}"],
                                    value_serializer=lambda m: json.dumps(m).encode("utf-8")
                                    )
    config_producer.send(config_topic, recording_parameters) # Sends as JSON
    config_producer.flush()
    print("Config sent")