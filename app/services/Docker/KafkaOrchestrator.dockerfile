FROM python:3.10-slim

WORKDIR /orchestrator

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    portaudio19-dev \
    python3-pyaudio \
    && rm -rf /var/lib/apt/lists/*

COPY services/ProgramsForRPI/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ProgramsForRPI/kafka_orchestrator.py \
     services/ProgramsForRPI/kafka_utils/topic_creator.py \
     services/ProgramsForRPI/kafka_producers/audio_producer.py \
     services/ProgramsForRPI/kafka_producers/config_producer.py \
     services/ProgramsForRPI/configs/recording_parameters.json \
     /orchestrator/

CMD [ "python", "kafka_orchestrator.py" ]