import asyncio
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
    "spectrogamDb": [1,2,6,2]
}

'''

# This dictionary holds a clients websocket and name
clients = {}

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
                    frequencies, times, spectrogram_db = spectrogram_data_generator.process_wav_chunk(message)

                    data = {"frequencies": frequencies,
                                "times": times,
                                "spectrogramDb": spectrogram_db}
                    data_json = json.dumps(data)
                    await forward_to_frontend(data_json)
                except Exception as e:
                    print(f"Error processing message: {e}")
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


async def forward_to_frontend(data):
    if 'spectrogram_client' in clients:
        try:
            await clients['spectrogram_client'].send(data)
            print("Sending data to spectrogram_client")
        except websockets.exceptions.ConnectionClosed:
            print("Connection to spectrogram_client was closed while sending")
            if 'spectrogram_client' in clients:
                clients.pop('spectrogram_client', None)
        except Exception as e:
            print(f"Error sending to spectrogram_client: {e}")
    else:
        print("No frontend client connected...")

async def main():
    server = await websockets.serve(
        handle_connection,
        "localhost",
        8766,
        ping_interval=30,
        ping_timeout=10
    )

    print("WebSocket server running on ws://localhost:8766")
    await asyncio.Future()

asyncio.run(main())