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
    
    if client_name == "audio_consumer":

        try:
            async for message in websocket:
                frequencies, times, spectrogram_db = spectrogram_data_generator.process_wav_chunk(message)

                data = {"frequencies": frequencies,
                        "times": times,
                        "spectrogramDb": spectrogram_db}
                data_json = json.dumps(data)
                await forward_to_frontend(data_json)
        except websockets.exceptions.ConnectionClosed as e:
            print(f"Client disconnected: {e}")
        except Exception as e:
            print(f"Error in handle_connection: {e}")
        finally:
            clients.pop(client_name, None)


async def forward_to_frontend(data):
    if 'spectrogram_client' in clients:
        await clients['spectrogram_client'].send(data)
    else:
        print("No frontend client connected...")
async def main():
    async with websockets.serve(handle_connection, "localhost", 8766):
        print(f"WebSocket server running on ws://localhost:8766")
        await asyncio.Future()

asyncio.run(main())