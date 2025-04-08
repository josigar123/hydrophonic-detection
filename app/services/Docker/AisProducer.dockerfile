FROM python:3.10-slim

WORKDIR /ais_producer

RUN apt-get update && \
     rm -rf /var/lib/apt/lists/*

COPY services/KafkaServices/ais_producer.py .
COPY services/ProgramsForRPI/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

CMD [ "python", "ais_producer.py" ]