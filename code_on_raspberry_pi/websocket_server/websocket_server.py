import asyncio
import websockets
import pyaudio

FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
DEVICE_INDEX = 1

IP = "10.0.0.13"
PORT = 8765

async def stream_audio(websocket):
    p = pyaudio.PyAudio()
    
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    input_device_index=DEVICE_INDEX,
                    frames_per_buffer=CHUNK)

    print("Streaming audio...")

    try:
        while True:
            data = stream.read(CHUNK, exception_on_overflow=False)
            await websocket.send(data)

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

    finally:
        stream.stop_stream()
        stream.close()
        p.terminate()
        print("Stopped streaming")

async def main():
    async with websockets.serve(stream_audio, IP, PORT):
        print(f"WebSocket Server running on ws://{IP}:{PORT}")
        await asyncio.Future()

asyncio.run(main())
