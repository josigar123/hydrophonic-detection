from pydantic import BaseModel
from typing import Any, Union, Tuple

class SpectrogramParameterModel(BaseModel):
    window_type: Union[str, Tuple[str, float]]
    n_samples: int
    frequency_cutoff: int # Unused so far
    uri: str # URI for wav-file to reprocess