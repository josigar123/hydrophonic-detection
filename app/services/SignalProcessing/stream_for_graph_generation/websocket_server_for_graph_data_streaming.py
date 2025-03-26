import asyncio
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
import numpy as np
import websockets
from spectrogram_data_generator import SpectrogramDataGenerator
from urllib.parse import parse_qs, urlparse
import json
import os
from utils import narrowband_detection
from kafka import KafkaProducer

'''

This file will contain the websocket server that is going to:
First: process the incoming wav chunk and generate appropriate graph data (Only spectrogram to start with)
Second: send that data out of the socket so that a web-client can connect and read the data

Server must also when connected to the frontend client, be able
to recieve requests for updating the spectrogram data generation 
that is being sent back to the frontend

The frontend client will recieve the following JSON object:

There will ALWAYS only be one time bin and one column in spectrogramDb in our implementation
{
    "frequencies": [1,2,3,46],
    "times": [1],
    "spectrogamDb": [1,2,6,2],
}

'''


clients = {}                   # This dictionary holds a clients websocket and name
spectrogram_client_config = {} # This will hold configurations for spectrogram and DEMON spectrogram
recording_config = {}          # This dict holds the most recent recording config

'''This function will read the current recording config from a Kafka topic

    config looks like this:
        {
            "channels": 1,
            "sampleRate": 44100,
            "recordingChunkSize": 1024
        }

    I recv the message from the broker and write it to a local json file for easy reading
'''

BOOTSTRAP_SERVERS = '10.0.0.24:9092'

async def consume_recording_config():
    """Async function to consume configuration messages from Kafka before WebSocket server starts."""
    global recording_config

    try:
        topic = 'recording-parameters'
        consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=BOOTSTRAP_SERVERS,
            auto_offset_reset='latest',
            enable_auto_commit=False,
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )

        await consumer.start()
        try:
            message = await consumer.getone()
            config_data = message.value
            
            # Create the target directory two levels up
            target_directory = os.path.join(os.path.dirname(__file__), "../../../configs")
            os.makedirs(target_directory, exist_ok=True)  # Ensure the 'configs' directory exists

            # Define the file path within the 'configs' directory
            file_path = os.path.join(target_directory, 'recording_parameters.json')

            with open(file_path, 'w') as json_file:
                json.dump(config_data, json_file, indent=4)
                print(f"Configuration saved to {file_path}")
            recording_config =config_data
            return config_data
        finally:
            await consumer.stop()
    except Exception as e:
        print(f"Error consuming configuration: {e}")
        raise
        

'''Function will produce a narrowband detection on the intensities passed and write it to the appropriate kafka topic'''
async def produce_narrowband_detection_result(spectrogram_db: list[float], threshold: float) -> bool:
    
    topic = 'narrowband-detection'
    bootstrap_servers = '10.0.0.24:9092'
    producer = AIOKafkaProducer(bootstrap_servers=BOOTSTRAP_SERVERS,
                value_serializer = lambda v: (1 if v else 0).to_bytes(1, byteorder='big'))

    await producer.start()
    try:
        is_detection = narrowband_detection(spectrogram_db, threshold)
        await producer.send(topic, value=is_detection)
        await producer.flush()
        print(f"A value of '{is_detection}' was sent to the kafka topic: '{topic}'")
    finally:
        await producer.stop()

    return is_detection

# A simple data generation, only with default parameters
spectrogram_data_generator = SpectrogramDataGenerator()

async def handle_connection(websocket, path):

    parsed_url = urlparse(path)
    query_params = parse_qs(parsed_url.query)

    print("Path for connection: " + path)
    client_name = query_params.get('client_name', ['Uknown'])[0]
    print(f"Client {client_name} connected to WebSocket from {websocket.remote_address}")
    clients[client_name] = websocket

    try:

        if client_name == "map_client":
            async for message in websocket:
                try:
                    print(f"Received message from map_client: {message[:100]}...")
                except Exception as e:
                    print(f"Error processing message: {e}")


        if client_name == "audio_consumer":
            async for message in websocket:

                try:
                    await forward_to_frontend(message)
                except Exception as e:
                    print(f"Error processing message: {e}")
                    
        if client_name == "ais_consumer":
            async for message in websocket:
                try:
                    await forward_ais_to_frontend(message)
                except Exception as e:
                    print(f"Error processing message {e}")
        
        '''
            Expect an object on this form, expect values in ALL fields:
            "config":
            {
                "spectrogramConfig": {
                    "tperseg": int,
                    "freq_filter": int (odd),
                    "hfilt_length": int,
                    "window": string
                },
                "demonSpectrogramConfig":{
                    "demonSampleFrequency": int,
                    "tperseg": int,
                    "frequencyFilter": int (odd),
                    "horizontalFilterLength": int,
                    "window": string
                },
                "narrowbandDetectionThresholdDb": int
            }
        '''
        if client_name == "spectrogram_client":
            async for message in websocket:
                try:

                    data = json.loads(message)
                    if "config" in data:
                        spectrogram_client_config[client_name] = data["config"]
                        print(f"Updated spectrogram configuration: {spectrogram_client_config[client_name]}")
                    else:
                        print(f"Received unknow message from {client_name}: {data}")

                except Exception as e:
                    print(f"Error handling message from {client_name}: {e}")

        elif client_name not in clients.keys():
            async for message in websocket:
                try:
                    print(f"Received message from {client_name}: {message[:100]}...")
                except Exception as e:
                    print(f"Error handling message from {client_name}: {e}")
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Client '{client_name}' disconnected: {e}")
    finally:

        if client_name in clients and clients[client_name] == websocket:
            clients.pop(client_name, None)
            print(f"Removed {client_name} from active clients")


async def forward_ais_to_frontend(data):
    if 'map_client' in clients:
        try:
            if isinstance(data, str):
                json_data = data
            elif isinstance(data, bytes):
                try:
                    json_data = data.decode('utf-8')
                except UnicodeDecodeError:
                    import base64
                    json_data = json.dumps({
                        "type": "binary_data",
                        "data": base64.b64encode(data).decode('ascii')
                    })
            else:
                json_data = json.dumps(data)
                
            await clients['map_client'].send(json_data)
        except websockets.exceptions.ConnectionClosed:
            print("Connection to map_client was closed while sending")
            if 'map_client' in clients:
                clients.pop('map_client', None)
        except Exception as e:
            print(f"Error sending to map_client: {e}")
    else:
        print("map_client not connected")

# This will return the number of samples required to fill hfilt_length seconds of sound 
def calculate_required_samples(hfilt_length: int, sample_rate: int):
    return int(hfilt_length * sample_rate)

def calculate_bytes_per_sample(bit_depth: int, channels: int):
    '''Function could be generalized, but we want to ensure a valid bit depth'''
    if bit_depth == 16:
        return 2 * channels  # 16-bit is 2 bytes per channel
    elif bit_depth == 32:
        return 4 * channels  # 32-bit is 4 bytes per channel
    else:
        raise ValueError(f"Unsupported bit depth: {bit_depth}")

spectrogram_audio_buffer = b"" # A byte array to accumulate audio for the spectrogram
demon_spectrogram_audio_buffer = b"" # A byte array to accumulate audio for the demon spectrogram
async def forward_to_frontend(data):

    global spectrogram_audio_buffer
    global demon_spectrogram_audio_buffer

    if 'spectrogram_client' in clients:
        try:
            # Config has been set when spectrogram_client connected
            spectrogram_config = spectrogram_client_config["spectrogram_client"]["spectrogramConfig"]
            demon_spectrogram_config = spectrogram_client_config["spectrogram_client"]["demonSpectrogramConfig"]
            narrowband_detection_threshold = spectrogram_client_config["spectrogram_client"]["narrowbandDetectionThresholdDb"]

            if spectrogram_config:
                tperseg = spectrogram_config.get("tperseg")
                freq_filter = spectrogram_config.get("frequencyFilter")
                hfilt_length = spectrogram_config.get("horizontalFilterLength")
                window = spectrogram_config.get("window")
            else:
                print("Spectrogram config is not available")
            
            if demon_spectrogram_config:
                demon_sample_frequency = demon_spectrogram_config.get("demonSampleFrequency") # A unique sample freq for DEMON specs
                demon_tperseg = demon_spectrogram_config.get("tperseg")
                demon_freq_filter = demon_spectrogram_config.get("frequencyFilter")
                demon_hfilt_length = demon_spectrogram_config.get("horizontalFilterLength")
                demon_window = demon_spectrogram_config.get("window")
            else:
                print("Demon spectrogram config is not available")

            if narrowband_detection_threshold:
                narrowband_threshold = narrowband_detection_threshold.get("threshold")
            else:
                print("Narrowband Threshold is not available")

            # TODO: Rewrite so that these values are only calculated once, not very expensive operations anyway
            required_samples = calculate_required_samples(hfilt_length, recording_config["sampleRate"])
            bytes_per_sample = calculate_bytes_per_sample(recording_config["bitDepth"], recording_config["channels"])
            required_buffer_size = required_samples * bytes_per_sample

            demon_required_samples = calculate_required_samples(demon_hfilt_length, recording_config["sampleRate"])
            demon_required_buffer_size = demon_required_samples * bytes_per_sample
            
            '''concat recvd audio, build buffer'''
            spectrogram_audio_buffer += data
            demon_spectrogram_audio_buffer += data

            '''Enough audio data for spectrogram data gen, also performs narrowband detection'''
            if len(spectrogram_audio_buffer) >= required_buffer_size:
                
                print("Spectrogram buffer filled, generating and sending data...")
                '''Adjusting the audio buffer so the amount of audio processed is always the same relative to required_buffer_size'''
                adjusted_spectrogram_audio_buffer, spectrogram_audio_buffer = spectrogram_audio_buffer[:required_buffer_size], spectrogram_audio_buffer[required_buffer_size:]
                frequencies, times, spectrogram_db = spectrogram_data_generator.create_spectrogram_data(adjusted_spectrogram_audio_buffer, recording_config["sampleRate"], recording_config["channels"], tperseg, freq_filter, hfilt_length, window, recording_config["bitDepth"])

                '''We flatten the spectrogram_db matrix since it will we a matrix with only one column'''
                spectrogram_db_flattened = np.ravel(spectrogram_db)
                data_dict = {
                    "frequencies": frequencies,
                    "times": times,
                    "spectrogramDb": spectrogram_db_flattened.tolist()
                }

                print("Performing narrowband detection...")
                '''Function expects an np.ndarray for efficient vectorized numpy calculations'''
                is_detection = await produce_narrowband_detection_result(spectrogram_db_flattened, narrowband_threshold)

                if is_detection: print("NARROWBAND DETECTION IN THE SPECTROGRAM DATA")
                data_json = json.dumps(data_dict)
                print("Sending spectrogram data...")
                await clients['spectrogram_client'].send(data_json)
                print("Spectrogram data sent...")  

            '''Enough audio data for demon spectrogram data gen'''
            if len(demon_spectrogram_audio_buffer) >= demon_required_buffer_size:

                print("Demon spectrogram buffer filled, generating and sending data...")
                '''Adjusting the audio buffer so the amount of audio processed is always the same relative to required_buffer_size'''
                adjusted_demon_spectrogram_audio_buffer, demon_spectrogram_audio_buffer = demon_spectrogram_audio_buffer[:demon_required_buffer_size], demon_spectrogram_audio_buffer[demon_required_buffer_size:]
                demon_frequencies, demon_times, demon_spectrogram_db = spectrogram_data_generator.create_demon_spectrogram_data(adjusted_demon_spectrogram_audio_buffer, recording_config["sampleRate"], demon_sample_frequency, recording_config["channels"], demon_tperseg, demon_freq_filter, demon_hfilt_length, demon_window, recording_config["bitDepth"])

                '''We flatten the demon_spectrogram_db matrix since it will we a matrix with only one column'''
                demon_data_dict = {
                    "demonFrequencies": demon_frequencies,
                    "demonTimes": demon_times,
                    "demonSpectrogramDb": np.ravel(demon_spectrogram_db).tolist()
                }
                
                print(f"DEMON INTENSITIES: {demon_data_dict['demonSpectrogramDb']}")

                demon_data_json = json.dumps(demon_data_dict)
                print("Sending demon spectrogram data...")
                await clients['spectrogram_client'].send(demon_data_json)
                print("Demon spectrogram data sent...")                                                                                                                                                                 
        except websockets.exceptions.ConnectionClosed:
            print("Connection to spectrogram_client was closed while sending")
            if 'spectrogram_client' in clients:
                clients.pop('spectrogram_client', None)
        except Exception as e:
            print(f"Error sending to spectrogram_client: {e}")
    else:
        print("spectrogram_client not connected")
        
    if 'waveform_client' in clients:
        try:
            await clients['waveform_client'].send(data)
            print("Sending data to waveform_client")
        except websockets.exceptions.ConnectionClosed:
            print("Connection to waveform_client was closed while sending")
            if 'waveform_client' in clients:
                clients.pop('waveform_client', None)
        except Exception as e:
            print(f"Error sending to waveform_client: {e}")
    else:
        print("waveform_client not connected...")

async def main():

    try:
        print("Loading configuration from Kafka...")
        recording_config = await consume_recording_config()

        if not recording_config:
            raise RuntimeError("Failed to load configuration from Kafka")
        
        print(f"Configuration loaded: {recording_config}")

        async with websockets.serve(
            handle_connection, 
            "localhost",
            8766,
            ping_interval=30,
            ping_timeout=10
        ) as server:
            print("WebSocket server running on ws://localhost:8766")
            await server.wait_closed()
    except Exception as e:
        print(f"Error during startup: {e}")
        raise

asyncio.run(main())