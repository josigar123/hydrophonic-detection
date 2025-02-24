import grpc
import wav_streamer_pb2
import wav_streamer_pb2_grpc
import websockets
import asyncio

'''

This file connects to the gRPC server found on the raspberry pi, and
starts recieving its stream of wav chunks

Data is continiously recieved and is then forwarded to a websocket server running
on the machine hosting the signal processing software, hence localhost
it also prints the size of each chunk

'''

async def send_to_websocket(data):
    uri = "ws://localhost:8766"
    async with websockets.connect(uri) as websocket:
        await websocket.send(data)

def recv_wav_and_forward_stream():
    channel = grpc.insecure_channel('10.0.0.13:50052')
    stub = wav_streamer_pb2_grpc.WavStreamerStub(channel)

    async def forward_data():
        async for response in stub.WavStreamer(wav_streamer_pb2.EmptyRequest()):
            print(f"Received WAV chunk of size: {len(response.wav_chunk)} bytes")
            await send_to_websocket(response.wav_chunk)
    try:
        asyncio.run(forward_data())
    except grpc.RpcError as e:
        print(f"gRPC error: {e.details()}")

if __name__ == "__main__":
    recv_wav_and_forward_stream()