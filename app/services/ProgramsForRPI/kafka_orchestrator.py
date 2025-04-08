from code_on_raspberry_pi.kafka_producers.config_producer import produce_audio_config
from code_on_raspberry_pi.kafka_producers.audio_producer import produce_audio, get_device_index
from code_on_raspberry_pi.kafka_utils.topic_creator import create_topic
import json
import os

'''

This file will first read the recording config and push this to the brokers topic,
then produce audio continously

'''

BOOTSTRAP_SERVERS = os.getenv('BOOTSTRAP_SERVERS') # 'ip:port'

RECORDING_PARAMETERS_FILE = "../configs/recording_parameters.json"

RECORDING_PARAMETERS_TOPIC = "recording-parameters"
AUDIO_STREAM_TOPIC = "audio-stream"
AIS_MESSAGE_TOPIC = "ais-log"
NARROWBAND_DETECTION_TOPIC = "narrowband-detection"
BROADBAND_DETECTION_TOPIC = "broadband-detection"
OVERRIDE_DETECTION_TOPIC = "override-detection"

if __name__ == "__main__":

    with open(RECORDING_PARAMETERS_FILE, "r") as file:
        recording_parameters = json.load(file)

    recording_parameters_config = {
        "retention.ms": "86400000", # Retaing config for 24 hrs
        "cleanup.policy": "compact"
    }
    
    create_topic(BOOTSTRAP_SERVERS, RECORDING_PARAMETERS_TOPIC, recording_parameters_config)
    create_topic(BOOTSTRAP_SERVERS, AUDIO_STREAM_TOPIC)
    create_topic(BOOTSTRAP_SERVERS, NARROWBAND_DETECTION_TOPIC)
    create_topic(BOOTSTRAP_SERVERS, BROADBAND_DETECTION_TOPIC)
    create_topic(BOOTSTRAP_SERVERS, AIS_MESSAGE_TOPIC)
    create_topic(BOOTSTRAP_SERVERS, OVERRIDE_DETECTION_TOPIC)

    # Produce the config to the topic before all else
    produce_audio_config(BOOTSTRAP_SERVERS, RECORDING_PARAMETERS_TOPIC, recording_parameters, key="config")

    # Fetch index of the device to listen to
    device_index = get_device_index()

    # Start producing audio to the topic from the desired device index
    produce_audio(BOOTSTRAP_SERVERS, "audio-stream", recording_parameters, device_index)
