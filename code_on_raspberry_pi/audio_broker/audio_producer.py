from kafka import KafkaProducer
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

# A larger Chunk size results in less processing overheaf, but leads to a higher latency and less frequent updates
 # no. of samples per audio frame, 1 sample is 1 recorded amplitude value
 # A format of 16-bit int gives 2 byte per sample, so we are recording 2048 byter per channel

def get_device_index():
    print("##############AUDIO INTERFACE SETUP##############")

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
        DEVICE_INDEX = int(input(f"From the list above, select your devices index [0, {device_count-1}]"))

    print("##############SETUP END##############")
    return DEVICE_INDEX

def produce_audio(broker_info: dict, audio_topic: str,  recording_parameters: dict, device_index: int):
    # INIT OF KAFKA PRODUCER
    producer = KafkaProducer(
        bootstrap_servers=[f"{broker_info["ip"]}:{broker_info["port"]}"],
        value_serializer= lambda v: v)

    def audio_callback(indata, frames, time, status):

        '''Sends chunks of audio to Kafka in real-time'''
        if status:
            print(f"Erro: {status}")
        print("Sending raw PCM data to broker...")
        producer.send(audio_topic, value=indata.tobytes())

    with sd.InputStream(
        samplerate=recording_parameters["sampleRate"],
        channels=recording_parameters["channels"],
        blocksize=recording_parameters["recordingChunkSize"],
        device=device_index,
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