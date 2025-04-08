FROM python:3.10-slim

WORKDIR /websocket_server

RUN apt-get update && \
    rm -rf /var/lib/apt/lists/*

COPY services/ProgramsForRPI/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/websocket_server.py .

RUN mkdir SignalProcessing

COPY services/SignalProcessing/__init__.py \
     services/SignalProcessing/SignalProcessingService.py \
     services/SignalProcessing/utils.py SignalProcessing/

CMD ["python", "websocket_server.py"]