import asyncio
import websockets
from spectrogram_data_generator import SpectrogramDataGenerator

'''

This file will contain the websocket server that is going to:
First: process the incoming wav chunk and generate appropriate graph data (Only spectrogram to start with)
Second: send that data out of the socket so that a web-client can connect and read the data


'''

clients = set()

async def recieve_wav_data(websocket):
    spectrogram_data_generator = SpectrogramDataGenerator()
    clients.add(websocket)
    try:
        async for message in websocket:
            if message is None:
                print("Warning: no message recieved")
                continue

            # Process the data here
            f, t, sx_db = spectrogram_data_generator.process_wav_chunk(message)
            spectrogram_data_list = [f, t, sx_db]
            await broadcast_to_clients(spectrogram_data_list)

    except Exception as e:
        print(f"Error handling client: {e}")
    finally:
        clients.discard(websocket)

async def broadcast_to_clients(processed_data):

    if not clients:
        print("No clients to broadcast to")
        return
    
    tasks = []
    for client in clients:
        tasks.append(send_to_client(client, processed_data))
    
    await asyncio.gather(*tasks, return_exceptions=True)

async def send_to_client(client, processed_data):
    try:
        await client.send(processed_data)
    except Exception as e:
        print(f"Failed to send data to client: {e}")
        clients.discard(client)

async def main():
    async with websockets.serve(recieve_wav_data, "localhost", 8766):
        print(f"WebSocket server running on ws://localhost:8766")
        await asyncio.Future()

asyncio.run(main())