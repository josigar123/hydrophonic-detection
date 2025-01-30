from pydantic import BaseModel
from typing import Any

class SpectrogramParameterModel(BaseModel):
    window_type: Any
    n_samples: int
    frequency_cutoff: int
    uri: str # URI to image to reprocess