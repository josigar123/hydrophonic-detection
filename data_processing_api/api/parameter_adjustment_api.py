from fastapi import APIRouter
from models.spectrogram_parameter_model import SpectrogramParameterModel
from services.process_spectrogram_parameters import SpectrogramPlotter
import os

router = APIRouter()

@router.post("/update-params")
async def update_params(data: SpectrogramParameterModel):
    
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../'))
    output_dir = os.path.join(project_root, "source_code/hydrophonic-detection/hydrophonic-detection/app/frontend/spectrogram_viewer_gui/public/assets/spectrograms/")
    os.makedirs(output_dir, exist_ok=True)

    spectrogram_plotter = SpectrogramPlotter(data)
    
    x, t, sample_rate = spectrogram_plotter.process_wav_file(data.uri)

    image_filename = f"{os.path.basename(data.uri).replace('.wav', '.png')}"
    image_path = os.path.join(output_dir, image_filename)

    spectrogram_plotter.plot_and_save_spectrogram(x, t, sample_rate, image_path, data.window_type, data.n_samples)

    print(f"Project root: {project_root}")
    print(f"Output directory: {output_dir}")
    if not os.access(output_dir, os.W_OK):
        raise PermissionError(f"Cannot write to {output_dir}")

    print(f"Saving image at: {image_path}")
    return {"message": "Spectrogram generated", "image_url": image_path}