import asyncio
import websockets
import pyaudio
import wave
import io

FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
CHUNK = 1024
PORT = 8765

print("#############SERVER SETUP#############")
IP = input("Enter private ip:")

print("Audio devices found:")
p = pyaudio.PyAudio()

for i in range(p.get_device_count()):
    dev = p.get_device_info_by_index(i)
    print(f"Index {i}: {dev['name']} - Input Channels: {dev['maxInputChannels']}")

p.terminate()
DEVICE_INDEX = int(input("Select an index from the above list:"))
print("#############SETUP END#############")


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
        wav_buffer = io.BytesIO()
        
        wav_writer = wave.open(wav_buffer, 'wb')
        wav_writer.setnchannels(CHANNELS)
        wav_writer.setsampwidth(p.get_sample_size(FORMAT))
        wav_writer.setframerate(RATE)

        while True:
            data = stream.read(CHUNK, exception_on_overflow=False)

            wav_writer.writeframes(data)

            wav_data = wav_buffer.getvalue()
            
            await websocket.send(wav_data)
            
            wav_buffer.seek(0)
            wav_buffer.truncate()

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
