import grpc
from concurrent import futures
import spectrogram_pb2
import spectrogram_pb2_grpc
from services.spectrogram_streamer_service import SpectrogramStreamer
from typing import Iterator

class SpectrogramService(spectrogram_pb2_grpc.SpectrogramServiceServicer):

    def __init__(self):
        self.streamer = SpectrogramStreamer()
    
    def StreamSpectrogram(self, request_iterator: Iterator[spectrogram_pb2.SpectrogramRequest], context):
        for request in request_iterator:
            if request.HasField("params"):
                self.streamer.update_params(
                    request.params
                )
                print("Updated spectrogram parameters:", request.params)
            f, t, sx_db = self.streamer.process_wav_chunk(request.audio_data)
            yield spectrogram_pb2.SpectrogramData(
                frequencies=f, times=t, power_levels=sx_db
            )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    spectrogram_pb2_grpc.add_SpectrogramServiceServicer_to_server(SpectrogramService(), server)
    server.add_insecure_port('[::]:50050')
    server.start()
    print("Successfully bound to port 50050")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()