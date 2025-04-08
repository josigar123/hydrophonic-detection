FROM python:3.10-slim

WORKDIR /event_consumer

RUN apt-get update && \
     rm -rf /var/lib/apt/lists/*

COPY services/ProgramsForRPI/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir Database

COPY services/KafkaServices/event_consumer.py .
COPY services/ProgramsForRPI/requirements.txt .
COPY configs/recording_parameters.json configs/mongodb_config.json /event_consumer/
COPY services/Database/mongodb_handler.py services/Database/minio_handler.py /event_consumer/Database/

CMD [ "python", "event_consumer.py" ]