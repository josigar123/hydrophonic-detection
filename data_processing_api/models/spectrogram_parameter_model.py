from pydantic import BaseModel

class SpectrogramParameterModel(BaseModel):
    window_type: any 
    n_samples: int
    frequency_cutoff: int
    uri: str # URI to image to reprocess