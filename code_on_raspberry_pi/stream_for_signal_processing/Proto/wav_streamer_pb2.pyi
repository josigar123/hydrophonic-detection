from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class WavData(_message.Message):
    __slots__ = ("wav_chunk",)
    WAV_CHUNK_FIELD_NUMBER: _ClassVar[int]
    wav_chunk: bytes
    def __init__(self, wav_chunk: _Optional[bytes] = ...) -> None: ...

class EmptyRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...
