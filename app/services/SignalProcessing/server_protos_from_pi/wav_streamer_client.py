import grpc
import wav_streamer_pb2
import wav_streamer_pb2_grpc

def recv_wav_stream():
    channel = grpc.insecure_channel('10.0.0.13:50052')
    stub = wav_streamer_pb2_grpc.WavStreamerStub(channel)

    try:
        for response in stub.WavStreamer(wav_streamer_pb2.WavRequest()):
            print(f"Received WAV chunk of size: {len(response.data)} bytes")
    except grpc.RpcError as e:
        print(f"gRPC error: {e.details()}")

if __name__ == "__main__":
    recv_wav_stream()