import grpc
from concurrent import futures
import os
import spectrogram_generator_service_pb2
import spectrogram_generator_service_pb2_grpc
from models.spectrogram_parameter_model import SpectrogramParameterModel
from services.process_spectrogram_parameters import SpectrogramPlotter

class SpectrogramGeneratorService(spectrogram_generator_service_pb2_grpc.SpectrogramGeneratorServicer):
    
    def GenerateSpectrogram(self, request, context):
        
        spectrogram_params = SpectrogramParameterModel(
            window_type=request.window_type,
            n_samples=request.n_samples,
            frequency_cutoff=request.frequency_cutoff,
            spectrogram_min=request.spectrogram_min,
            wav_data=request.wav_data
        )
        
        spectrogram_plotter = SpectrogramPlotter(spectrogram_params)
        x, t, sample_rate = spectrogram_plotter.process_wav_file(spectrogram_params.wav_data)
        
        png_bytes = spectrogram_plotter.plot_and_save_spectrogram(x, t, sample_rate, spectrogram_params.window_type, spectrogram_params.n_samples, spectrogram_params.spectrogram_min)
        
        return spectrogram_generator_service_pb2.SpectrogramGeneratorResponse (
            message="Spectrogram generated successfully",
            spectrogram_image_file = png_bytes
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