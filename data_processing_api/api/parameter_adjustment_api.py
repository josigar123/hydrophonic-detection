from fastapi import APIRouter
from models.spectrogram_parameter_model import SpectrogramParameterModel
from services.process_spectrogram_parameters import SpectrogramPlotter

app = APIRouter()

@app.post("/update-params")
async def update_params(data: SpectrogramParameterModel):
    
    # CONSTANTS
    fmax = 1e3
    
    spectrogram_plotter = SpectrogramPlotter(SpectrogramParameterModel)
    
    return {"message": "Parameters updated", "data": data}