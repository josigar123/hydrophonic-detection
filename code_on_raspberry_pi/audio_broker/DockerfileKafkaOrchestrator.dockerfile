FROM python:3.10-slim

WORKDIR /orchestrator

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    portaudio19-dev \
    python3-pyaudio \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY kafka_orchestrator.py topic_creator.py audio_producer.py config_producer.py broker_info.json recording_parameters.json /orchestrator/

CMD [ "python", "kafka_orchestrator.py" ]