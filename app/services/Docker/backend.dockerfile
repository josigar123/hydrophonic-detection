FROM python:3.10-slim

WORKDIR /app
ENV PYTHONPATH="/app"

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    portaudio19-dev \
    python3-pyaudio \
    && rm -rf /var/lib/apt/lists/*
    
COPY services/KafkaServices /app/services/KafkaServices
COPY services/ProgramsOnRPI/ /app/services/
COPY configs /app/configs
COPY services/SignalProcessing /app/services/SignalProcessing
COPY services/ServiceUtils /app/services/ServiceUtils
COPY services/websocket_server.py /app/services/websocket_server.py
COPY services/Database/ /app/services/Database/

RUN pip install --no-cache-dir -r /app/services/KafkaServices/requirements.txt
RUN pip install --no-cache-dir -r /app/services/requirements.txt

WORKDIR /app/services
EXPOSE 8766

CMD ["sh", "-c", "\
    python -m kafka_orchestrator & \
    python websocket_server.py & \
    python -m KafkaServices.ais_api_producer & \
    python -m KafkaServices.ais_producer & \
    python -m KafkaServices.ais_consumer & \
    python -m KafkaServices.audio_consumer & \
    wait"]
