#!/bin/bash

python3 -m grpc_tools.protoc -I. --python_out=. --pyi_out=. --grpc_python_out=. wav_streamer.proto