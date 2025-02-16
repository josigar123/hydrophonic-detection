#!/bin/bash

mkdir -p grpc_generated_files/grpc_stub_for_spectrogram_regeneration
mkdir -p grpc_generated_files/grpc_stub_for_spectrogram_streaming

python3 -m grpc_tools.protoc -I=protos \
  --python_out=grpc_generated_files/grpc_stub_for_spectrogram_regeneration \
  --grpc_python_out=grpc_generated_files/grpc_stub_for_spectrogram_regeneration \
  spectrogram_generator_service.proto

python3 -m grpc_tools.protoc -I=protos \
  --python_out=grpc_generated_files/grpc_stub_for_spectrogram_streaming \
  --grpc_python_out=grpc_generated_files/grpc_stub_for_spectrogram_streaming \
  spectrogram.proto
