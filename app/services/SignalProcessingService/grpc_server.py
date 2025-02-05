import grpc
from concurrent import futures
import os
import spectrogram_generator_service_pb2
import spectrogram_generator_service_pb2_grpc
from models.spectrogram_parameter_model import SpectrogramParameterModel
from services.process_spectrogram_parameters import SpectrogramPlotter

class SpectrogramGeneratorService(spectrogram_generator_service_pb2_grpc.SpectrogramGeneratorServicer):
    
    def GenerateSpectrogram(self, request, context):
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../'))
        output_dir = os.path.join(project_root, "hydrophonic-detection/hydrophonic-detection/app/frontend/spectrogram_viewer_gui/public/assets/spectrograms/")
        os.makedirs(output_dir, exist_ok=True)
        
        spectrogram_params = SpectrogramParameterModel(
            window_type=request.window_type,
            n_samples=request.n_samples,
            frequency_cutoff=request.frequency_cutoff,
            spectrogram_min=request.spectrogram_min,
            uri=request.uri_to_wav
        )
        
        spectrogram_plotter = SpectrogramPlotter(spectrogram_params)
        x, t, sample_rate = spectrogram_plotter.process_wav_file(request.uri_to_wav)

        image_filename = f"{os.path.basename(request.uri_to_wav).replace('.wav', '.png')}"
        image_path = os.path.join(output_dir, image_filename)
        
        spectrogram_plotter.plot_and_save_spectrogram(x, t, sample_rate, image_path, spectrogram_params.window_type, spectrogram_params.n_samples, spectrogram_params.spectrogram_min)
        
        return spectrogram_generator_service_pb2.SpectrogramGeneratorResponse (
            message="Spectrogram generated successfully",
            uri_to_pnk = image_path
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    spectrogram_generator_service_pb2_grpc.add_SpectrogramGeneratorServicer_to_server(SpectrogramGeneratorService(), server)
    server.add_insecure_port('[::]:50051...')
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    serve()