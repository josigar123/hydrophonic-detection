FROM python:3.10-slim

WORKDIR /websocket_server

RUN apt-get update && \
    rm -rf /var/lib/apt/lists/*

COPY ../../code_on_raspberry_pi/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ../websocket_server.py .

RUN mkdir SignalProcessing

COPY ../SignalProcessing/__init__.py \
     ../SignalProcessing/SignalProcessingService.py \
     ../SignalProcessing/utils.py SignalProcessing/

CMD ["python", "websocket_server.py"]