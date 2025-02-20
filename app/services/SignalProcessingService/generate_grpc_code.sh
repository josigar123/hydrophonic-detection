#!/bin/bash

python3 -m grpc_tools.protoc -I=protos \
  --python_out=servers \
  --grpc_python_out=servers \
  spectrogram_generator_service.proto

python3 -m grpc_tools.protoc -I=protos \
  --python_out=servers \
  --grpc_python_out=servers \
  spectrogram.proto
