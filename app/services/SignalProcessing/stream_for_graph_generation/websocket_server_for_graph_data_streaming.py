import asyncio
from aiokafka import AIOKafkaConsumer
import websockets
from spectrogram_data_generator import SpectrogramDataGenerator
from urllib.parse import parse_qs, urlparse
import json

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

'''
async def consume_recording_config():
    """Async function to consume configuration messages from Kafka before WebSocket server starts."""
    global recording_config

    consumer = AIOKafkaConsumer(
        'recording-configurations',
        bootstrap_servers='10.0.0.10:9092',
        auto_offset_reset='latest',
        enable_auto_commit=True,
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )

    await consumer.start()
    try:
        async for message in consumer:
            try:
                config_data = message.value
                print(f"Received new configuration: {config_data}")
                recording_config = config_data
            except Exception as e:
                print(f"Error processing configuration message: {e}")
    finally:
        await consumer.stop()



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
                    print(f"Recording parameters: {recording_config}")
                    await forward_to_frontend(message)
                except Exception as e:
                    print(f"Error processing message: {e}")
        if client_name == "ais_consumer":
            async for message in websocket:
                try:
                    await forward_ais_to_frontend(message)
                except Exception as e:
                    print(f"Error processing message {e}")
        
        if client_name == "spectrogram_client":
            async for message in websocket:
                try:

                    data = json.loads(message)
                    if "config" in data:
                        spectrogram_client_config[client_name]  = data["config"]
                        print(f"Updated spectrogram configuration: {spectrogram_client_config[client_name]}")
                    else:
                        print(f"Received unknow message from {client_name}: {data}")
                except Exception as e:
                    print(f"Error handling message from {client_name}: {e}")
        else:

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

async def forward_to_frontend(data):
    if 'spectrogram_client' in clients:
        try:
            frequencies, times, spectrogram_db = spectrogram_data_generator.process_audio_chunk(data, recording_config["sampleRate"], bit_depth=1, channels=recording_config["channels"])
     
            data_dict = {
                    "frequencies": frequencies,
                    "times": times,
                    "spectrogramDb": spectrogram_db # SpectrogramDb Is a matrix
                            }
            data_json = json.dumps(data_dict)
            await clients['spectrogram_client'].send(data_json)
            print("Sending data to spectrogram_client")
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

    await consume_recording_config()

    consumer_task = asyncio.create_task(consume_recording_config())

    server = await websockets.serve(
        handle_connection,
        "localhost",
        8766,
        ping_interval=30,
        ping_timeout=10
    )

    print("WebSocket server running on ws://localhost:8766")
    await asyncio.gather(consumer_task, server.wait_closed())

asyncio.run(main())