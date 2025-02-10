from pydantic import BaseModel
from typing import Any, Union, Tuple

class SpectrogramParameterModel(BaseModel):
    window_type: str
    n_segment: int
    highpass_cutoff: int
    lowpass_cutoff: int # Unused, no lowpass function supplied yet
    color_scale_min: int
    max_displayed_frequency: int
    wav_data: bytes