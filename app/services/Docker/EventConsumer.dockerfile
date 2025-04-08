FROM python:3.10-slim

WORKDIR /event_consumer

RUN apt-get update && \
     rm -rf /var/lib/apt/lists/*

RUN mkdir Database

COPY ../KafkaServices/event_consumer.py .
COPY ../../code_on_raspberry_pi/requirements.txt .
COPY ../../configs/recording_parameters.json ../../configs/mongodb_config.json /event_consumer/
COPY ../Database/mongodb_handler.py ../Database/minio_handler.py /event_consumer/Database/

CMD [ "python", "event_consumer.py" ]