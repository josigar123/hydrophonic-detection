from config_producer import produce_audio_config
from audio_producer import produce_audio, get_device_index
from topic_creator import create_topic
import json

'''

This file will first read the recording config and push this to the brokers topic,
then produce audio continously

'''

BROKER_INFO_FILE = "broker_info.json"
RECORDING_PARAMETERS_FILE = "recording_parameters.json"

RECORDING_PARAMETERS_TOPIC = "recording-parameters"
AUDIO_STREAM_TOPIC = "audio-stream"
AIS_MESSAGE_TOPIC = "ais-log"
NARROWBAND_DETECTION_TOPIC = "narrowband-detection"
BROADBAND_DETECTION_TOPIC = "broadband-detection"
OVERRIDE_DETECTION_TOPIC = "override-detection"

if __name__ == "__main__":
    with open(BROKER_INFO_FILE, "r") as file:
        broker_info = json.load(file)

    with open(RECORDING_PARAMETERS_FILE, "r") as file:
        recording_parameters = json.load(file)

    recording_parameters_config = {
        "retention.ms": "86400000", # Retaing config for 24 hrs
        "cleanup.policy": "compact"
    }
    create_topic(broker_info, RECORDING_PARAMETERS_TOPIC, recording_parameters_config)
    create_topic(broker_info, AUDIO_STREAM_TOPIC)
    create_topic(broker_info, NARROWBAND_DETECTION_TOPIC)
    create_topic(broker_info, BROADBAND_DETECTION_TOPIC)
    create_topic(broker_info, AIS_MESSAGE_TOPIC)
    create_topic(broker_info, OVERRIDE_DETECTION_TOPIC)

    # Produce the config to the topic before all else
    produce_audio_config(broker_info, "recording-parameters", recording_parameters, key="config")

    # Fetch index of the device to listen to
    device_index = get_device_index()

    # Start producing audio to the topic from the desired device index
    produce_audio(broker_info, "audio-stream", recording_parameters, device_index)
