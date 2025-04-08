FROM python:3.10-slim

WORKDIR /orchestrator

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    portaudio19-dev \
    python3-pyaudio \
    && rm -rf /var/lib/apt/lists/*

COPY ../../code_on_raspberry_pi/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ../../code_on_raspberry_pi/kafka_orchestrator.py \
     ../../code_on_raspberry_pi/kafka_utils/topic_creator.py \
     ../../code_on_raspberry_pi/kafka_producers/audio_producer.py \
     ../../code_on_raspberry_pi/kafka_producers/config_producer.py \
     ../../code_on_raspberry_pi/configs/recording_parameters.json \
     /orchestrator/

CMD [ "python", "kafka_orchestrator.py" ]