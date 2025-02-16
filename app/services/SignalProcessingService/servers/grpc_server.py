import grpc
from concurrent import futures
import app.services.SignalProcessingService.grpc_generated_files.grpc_stub_for_spectrogram_regeneration.spectrogram_generator_service_pb2 as spectrogram_generator_service_pb2
import app.services.SignalProcessingService.grpc_generated_files.grpc_stub_for_spectrogram_regeneration.spectrogram_generator_service_pb2_grpc as spectrogram_generator_service_pb2_grpc
from models.spectrogram_parameter_model import SpectrogramParameterModel
from services.process_spectrogram_parameters import SpectrogramPlotter

class SpectrogramGeneratorService(spectrogram_generator_service_pb2_grpc.SpectrogramGeneratorServicer):
    
    def GenerateSpectrogram(self, request, context):
        
        spectrogram_params = SpectrogramParameterModel(
            window_type=request.window_type,
            n_segment=request.n_segment,
            highpass_cutoff=request.highpass_cutoff,
            lowpass_cutoff=request.lowpass_cutoff,
            color_scale_min=request.color_scale_min,
            max_displayed_frequency=request.max_displayed_frequency,
            wav_data=request.wav_data
        )
        
        spectrogram_plotter = SpectrogramPlotter(spectrogram_params)
        x, _, sample_rate = spectrogram_plotter.process_wav_file(spectrogram_params.wav_data, spectrogram_params.highpass_cutoff)
        
        image_byte_array = spectrogram_plotter.plot_and_save_spectrogram(x, sample_rate, spectrogram_params.window_type, spectrogram_params.n_segment, spectrogram_params.max_displayed_frequency, spectrogram_params.color_scale_min)
        
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