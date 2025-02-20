import grpc
from concurrent import futures
import spectrogram_generator_service_pb2
import spectrogram_generator_service_pb2_grpc
from services.process_spectrogram_parameters import SpectrogramPlotter

class SpectrogramGeneratorService(spectrogram_generator_service_pb2_grpc.SpectrogramGeneratorServicer):
    
    def GenerateSpectrogram(self, request: spectrogram_generator_service_pb2.SpectrogramGeneratorRequest, context):
        
        spectrogram_plotter = SpectrogramPlotter(request)
        x, _, sample_rate = spectrogram_plotter.process_wav_file(request.wav_data, request.highpass_cutoff)
        
        image_byte_array = spectrogram_plotter.plot_and_save_spectrogram(x, sample_rate, request.window_type, request.n_segment, request.max_displayed_frequency, request.color_scale_min)
        
        return spectrogram_generator_service_pb2.SpectrogramGeneratorResponse (
            message="Spectrogram generated successfully",
            spectrogram_image_file = image_byte_array
        )

def serve():

    server_options = [
        ('grpc.max_receive_message_length', 50 * 1024 * 1024),
        ('grpc.max_send_message_length', 50 * 1024 * 1024), 
    ]

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10), options=server_options)
    spectrogram_generator_service_pb2_grpc.add_SpectrogramGeneratorServicer_to_server(SpectrogramGeneratorService(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("Successfully bound to port 50051")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()