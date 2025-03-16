import asyncio
from aiokafka import AIOKafkaConsumer
import websockets
from spectrogram_data_generator import SpectrogramDataGenerator
from urllib.parse import parse_qs, urlparse
import json
import os

'''

This file will contain the websocket server that is going to:
First: process the incoming wav chunk and generate appropriate graph data (Only spectrogram to start with)
Second: send that data out of the socket so that a web-client can connect and read the data

Server must also when connected to the frontend client, be able
to recieve requests for updating the spectrogram data generation 
that is being sent back to the frontend

The frontend client will recieve the following JSON object:

{
    "frequencies": [1,2,3,46],
    "times": [2,3,5,6],
    "spectrogamDb": [[1,2,6,2]],
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
async def consume_recording_config():
    """Async function to consume configuration messages from Kafka before WebSocket server starts."""
    global recording_config

    try:
        topic = 'recording-parameters'
        bootstrap_servers = '10.0.0.24:9092'
        consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
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
            NOTE: When spectrogram client first connects, expect a JSON object containing parameters for generating the AIS data

            Expect an object on this form:

            "spectrogramConfig": {
                "tperseg": int,
                "freq_filter": int (odd),
                "hfilt_length": int,
                "window": string
            }
        '''
        if client_name == "spectrogram_client":
            async for message in websocket:
                try:

                    data = json.loads(message)
                    if "spectrogramConfig" in data:
                        spectrogram_client_config[client_name]  = data["spectrogramConfig"]
                        print(f"Updated spectrogram configuration: {spectrogram_client_config[client_name]}")
                    else:
                        print(f"Received unknow message from {client_name}: {data}")
                except Exception as e:
                    print(f"Error handling message from {client_name}: {e}")

        if client_name not in clients.keys:
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
            await clients['map_client'].send(data)
            print("Forwarded AIS data to map_client")
        except websockets.exceptions.ConnectionClosed:
            print("Connection to map_client was closed while sending")
            if 'map_client' in clients:
                clients.pop('map_client', None)
        except Exception as e:
            print(f"Error sending to map_client: {e}")
    else:
        print("map_client not connected")

audio_buffer = b"" # A byte array to accumulate audio

# This will return the number of samples required to fill hfilt_length seconds of sound 
def calculate_required_samples(hfilt_length: int, sample_rate: int):
    return int(hfilt_length * sample_rate)

def calculate_bytes_per_sample(bit_depth: int, channels: int):
    '''Functin could be generalized, but we want to ensure a valid bit depth'''
    if bit_depth == 16:
        return 2 * channels  # 16-bit is 2 bytes per channel
    elif bit_depth == 32:
        return 4 * channels  # 32-bit is 4 bytes per channel
    else:
        raise ValueError(f"Unsupported bit depth: {bit_depth}")


async def forward_to_frontend(data):

    global audio_buffer

    if 'spectrogram_client' in clients:
        try:
            # Config has been set when spectrogram_client connected
            spectrogram_config = spectrogram_client_config.get("spectrogram_client")

            if spectrogram_config:
                tperseg = spectrogram_config.get("tperseg")
                freq_filter = spectrogram_config.get("frequencyFilter")
                hfilt_length = spectrogram_config.get("horizontalFilterLength")
                window = spectrogram_config.get("window")
            #frequencies, times, spectrogram_db = spectrogram_data_generator.process_audio_chunk(data, recording_config["sampleRate"], bit_depth=recording_config["bitDepth"], channels=recording_config["channels"])

            # TODO: Rewrite so that these values are only calculated once, not very expensive operations anyway
            required_samples = calculate_required_samples(hfilt_length, recording_config["sampleRate"])
            bytes_per_sample = calculate_bytes_per_sample(recording_config["bitDepth"], recording_config["channels"])
            required_buffer_size = required_samples * bytes_per_sample

            audio_buffer += data # concat recvd audio, build buffer

            print(f"Current audio_buffer length: {len(audio_buffer)}")
            print(f"Required buffer size to send: {required_buffer_size}")

            if len(audio_buffer) >= required_buffer_size:
                
                print("Buffer filled, generating and sending data...")
                '''Adjusting the audio buffer so the amount of audio processed is always the same relative to required_buffer_size'''
                adjusted_audio_buffer, audio_buffer = audio_buffer[:required_buffer_size], audio_buffer[required_buffer_size:]
                frequencies, times, spectrogram_db = spectrogram_data_generator.create_spectrogram_data(adjusted_audio_buffer, recording_config["sampleRate"], recording_config["channels"], tperseg, freq_filter, hfilt_length, window, recording_config["bitDepth"])

                data_dict = {
                    "frequencies": frequencies,
                    "times": times,
                    "spectrogramDb": spectrogram_db
                }
               
                data_json = json.dumps(data_dict)
                print("Sending data...")
                await clients['spectrogram_client'].send(data_json)
                print("Data sent...")                                                                                                                                                                            
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