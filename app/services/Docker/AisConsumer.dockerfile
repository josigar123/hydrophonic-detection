FROM python:3.10-slim

WORKDIR /ais_consumer

RUN apt-get update && \
     rm -rf /var/lib/apt/lists/*

RUN mkdir ServiceUtilities

COPY services/KafkaServices/ais_consumer.py .
COPY services/ProgramsForRPI/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ServiceUtilities/websocket_client.py /audio_consumer/ServiceUtilities/

CMD [ "python", "ais_consumer.py" ]