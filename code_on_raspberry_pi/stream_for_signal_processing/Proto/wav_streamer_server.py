'''

This wil will recive an empty request, opening a stream. Will then read PCM data from an audio interface
and create about 1sec long wac chunks which are to be stremed back to the requesting client.

'''

import grpc
from concurrent import futures
import wav_streamer_pb2
import wav_streamer_pb2_grpc
import pyaudio
import wave
import io

class WavStreamerServicer(wav_streamer_pb2_grpc.WavStreamerServicer):
    
    def WavStreamer(self, request, context):
        print("Client connected, starting WAV stream...")

        FORMAT = pyaudio.paInt16
        CHANNELS = 1
        RATE = 44100
        CHUNK = 1024
        DEVICE_INDEX = 4

        p = pyaudio.PyAudio()

        stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    input_device_index=DEVICE_INDEX,
                    frames_per_buffer=CHUNK)
        
        frames = []
        try:
            while context.is_active():
                data = stream.read(CHUNK, exception_on_overflow=False)
                frames.append(data)
                # Convert into a wav chunk
                if len(frames) >= 43:  # ~1 second of audio (44100 / 1024 ≈ 43)
                    wav_buffer = io.BytesIO()
                    wf = wave.open(wav_buffer, "wb")
                    wf.setnchannels(CHANNELS)
                    wf.setsampwidth(p.get_sample_size(FORMAT))
                    wf.setframerate(RATE)
                    wf.writeframes(b''.join(frames))
                    wf.close()

                    wav_data = wav_buffer.getvalue()
                    yield wav_streamer_pb2.WavData(data=wav_data)
                    frames = []
        except grpc.RpcError as e:
            print(f"Client disconnected: {e.details()}")
        finally:
            stream.stop_stream()
            stream.close()
            p.terminate()
            print("Streaming stopped")




def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    wav_streamer_pb2_grpc.add_WavStreamerServicer_to_server(WavStreamerServicer(), server)
    server.add_insecure_port('10.0.0.13:50052')
    server.start()
    print("Succesfully bound to port 50052 on 10.0.0.13")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()