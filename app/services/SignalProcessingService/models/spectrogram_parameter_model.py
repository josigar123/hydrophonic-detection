from pydantic import BaseModel
from typing import Any, Union, Tuple

class SpectrogramParameterModel(BaseModel):
    window_type: Union[str, Tuple[str, float]]
    n_samples: int
    frequency_cutoff: int # Unused so far
    spectrogram_min: int
    frequency_max: int
    wav_data: bytes