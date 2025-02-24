from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class WavData(_message.Message):
    __slots__ = ("waw_chunk",)
    WAW_CHUNK_FIELD_NUMBER: _ClassVar[int]
    waw_chunk: bytes
    def __init__(self, waw_chunk: _Optional[bytes] = ...) -> None: ...

class EmptyRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...
