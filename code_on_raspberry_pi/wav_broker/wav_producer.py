import wave
from kafka import KafkaProducer
import json
import pyaudio
import io

with open("broker_info.json", "r") as file:
    broker_info = json.load(file)

with open("recording_parameters.json", "r") as file:
    recording_parameters = json.load(file)

broker_ip  = broker_info["ip"]
broker_port = broker_info["brokerPort"]
topic = broker_info["topicName"]

print("##############PRODUCER SETUP##############")
p = pyaudio.PyAudio()

FORMAT = pyaudio.paInt16
CHANNELS = recording_parameters["channels"]
SAMPLE_RATE = recording_parameters["sampleRate"]
RECORDING_CHUNK_SIZE = recording_parameters["recordingChunkSize"]
SAMPLE_WIDTH = p.get_sample_size(FORMAT)

print("Audio devices found:")
device_count = p.get_device_count()
for i in range(device_count):
    dev = p.get_device_info_by_index(i)
    print(f"Index {i}: {dev['name']} - Input Channels: {dev['maxInputChannels']}")
p.terminate()

DEVICE_INDEX = input(f"From the list above, select your devices index [0, {device_count-1}]")
while DEVICE_INDEX.isalpha() or (DEVICE_INDEX < 0 or DEVICE_INDEX >= device_count):
    print(f"ILLEGAL VALUE: {DEVICE_INDEX}")
    DEVICE_INDEX = input(f"From the list above, select your devices index [0, {device_count-1}]")

print("##############SETUP END##############")

# INIT OF KAFKA PRODUCER
producer = KafkaProducer(
    bootstrap_servers=[f"{broker_ip}:{broker_port}"],
    value_serializer=lambda v: v
)


def create_audio_stream(pyaudio_instance):
    stream = pyaudio_instance.open(format=FORMAT,
                                   channels=CHANNELS,
                                   rate=SAMPLE_RATE,
                                   input=True,
                                   input_device_index=DEVICE_INDEX,
                                   frames_per_buffer=RECORDING_CHUNK_SIZE)
    return stream    

frames = []
try:
    pyaudio_instance = pyaudio.PyAudio()
    stream = create_audio_stream(pyaudio_instance)
    while True:
        data = stream.read(RECORDING_CHUNK_SIZE, exception_on_overflow=False)
        frames.append(data)

        if len(frames) >= 43:
            wav_buffer = io.BytesIO()
            wf = wave.open(wav_buffer, "wb")
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(SAMPLE_WIDTH)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(b''.join(frames))
            wf.close()

            wav_data = wav_buffer.getvalue()
            producer.send(topic, value=wav_data)
            frames = []

except Exception as e:
    print("Error", e)
finally:
    stream.stop_stream()
    stream.close()
    pyaudio_instance.terminate()
    print("Stopped stream")