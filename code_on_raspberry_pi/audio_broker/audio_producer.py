from kafka import KafkaProducer
import json
import sounddevice as sd
import numpy as np

'''

This Kafka producer depends on PortAudio and Sounddevice to record 
audio from an audio interface and reads recording configurations from
recording_parameters.json

It produces raw PCM data to the audio-stream topic
NOTE: Stream must be reconstructed on the receiving end
either in the consumer or before visualizing in the frontend

'''

with open("broker_info.json", "r") as file:
    broker_info = json.load(file)

with open("recording_parameters.json", "r") as file:
    recording_parameters = json.load(file)

broker_ip  = broker_info["ip"]
broker_port = broker_info["brokerPort"]
topic = broker_info["topicName"]

print("##############PRODUCER SETUP##############")

# A larger Chunk size results in less processing overheaf, but leads to a higher latency and less frequent updates
CHANNELS = recording_parameters["channels"]
SAMPLE_RATE = recording_parameters["sampleRate"]
RECORDING_CHUNK_SIZE = recording_parameters["recordingChunkSize"] # no. of samples per audio frame, 1 sample is 1 recorded amplitude value                         # A format of 16-bit int gives 2 byte per sample, so we are recording 2048 byter per channel
SAMPLES_PER_SECOND = SAMPLE_RATE / RECORDING_CHUNK_SIZE

print("Audio devices found:")
found_devices = sd.query_devices()
device_count = len(found_devices)
for key, value in enumerate(found_devices):
    device_name = value['name']
    max_input_channels = value['max_input_channels']
    print(f"Index: {key}, Name: {device_name}, Max Input Channels: {max_input_channels}")

DEVICE_INDEX = input(f"From the list above, select your devices index [0, {device_count-1}]: ")
while DEVICE_INDEX.isalpha() or (int(DEVICE_INDEX) < 0 or int(DEVICE_INDEX) >= device_count):
    print(f"ILLEGAL VALUE: {DEVICE_INDEX}")
    DEVICE_INDEX = input(f"From the list above, select your devices index [0, {device_count-1}]")

print("##############SETUP END##############")

print()

# INIT OF KAFKA PRODUCER
producer = KafkaProducer(
    bootstrap_servers=[f"{broker_ip}:{broker_port}"],
    value_serializer= lambda m: json.dumps(m.decode('utf-8'))
)

print("##############PRODUCING CONFIG TO recording-configurations##############")
config_producer = KafkaProducer(bootstrap_servers=[f"{broker_ip}:{broker_port}"],
                                value_serializer=lambda v: v)
config_topic = "recording-configurations"
config_producer.send(config_topic, recording_parameters) # Sends as JSON
config_producer.flush()
print("Config sent")

def audio_callback(indata, frames, time, status):

    '''Sends chunks of audio to Kafka in real-time'''
    if status:
        print(f"Erro: {status}")
    print("Sending raw PCM data to broker...")
    producer.send(topic, value=indata.tobytes())

with sd.InputStream(
    samplerate=SAMPLE_RATE,
    channels=CHANNELS,
    blocksize=RECORDING_CHUNK_SIZE,
    device=DEVICE_INDEX,
    dtype=np.int16,
    callback=audio_callback
): 
    print("Press Ctrl+C to stop recording...")
    try:
        while True:
            pass # Keeps script running
    except KeyboardInterrupt:
        print("Stopping Kafka producer...")
        print("Exiting and closing stream...")
        


print("Stopping Kafka producer...")
producer.flush()
producer.close()
print("Stopped producer.")