from KafkaProducers.audio_producer import produce_audio, get_device_index
from KafkaUtils.topic_creator import create_topic
import json

'''

This file will first read the recording config and push this to the brokers topic,
then produce audio continously

'''

BROKER_INFO_RELATIVE_PATH = "../../configs/broker_info.json"
RECORDING_PARAMETERS_RELATIVE_PATH = "../../configs/recording_parameters.json"

RECORDING_PARAMETERS_TOPIC = "recording-parameters"
AUDIO_STREAM_TOPIC = "audio-stream"
AIS_MESSAGE_TOPIC = "ais-log"
NARROWBAND_DETECTION_TOPIC = "narrowband-detection"
BROADBAND_DETECTION_TOPIC = "broadband-detection"
OVERRIDE_DETECTION_TOPIC = "override-detection"
USER_POSITION_TOPIC = "user-position"
RECORDING_STATUS_TOPIC = "recording-status"

if __name__ == "__main__":
    with open(BROKER_INFO_RELATIVE_PATH, "r") as file:
        broker_info = json.load(file)

    with open(RECORDING_PARAMETERS_RELATIVE_PATH, "r") as file:
        recording_parameters = json.load(file)

    create_topic(broker_info, AUDIO_STREAM_TOPIC)
    create_topic(broker_info, NARROWBAND_DETECTION_TOPIC)
    create_topic(broker_info, BROADBAND_DETECTION_TOPIC)
    create_topic(broker_info, AIS_MESSAGE_TOPIC)
    create_topic(broker_info, OVERRIDE_DETECTION_TOPIC)
    create_topic(broker_info, USER_POSITION_TOPIC)
    create_topic(broker_info, RECORDING_STATUS_TOPIC)

    # Fetch index of the device to listen to
    device_index = get_device_index()

    # Start producing audio to the topic from the desired device index
    produce_audio(broker_info, AUDIO_STREAM_TOPIC, recording_parameters, device_index)
    
