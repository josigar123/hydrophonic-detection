FROM python:3.10-slim

WORKDIR /ais_api_producer

RUN apt-get update && \
     rm -rf /var/lib/apt/lists/*

RUN mkdir ServiceUtilities
RUN mkdir configs

COPY services/KafkaServices/ais_api_producer.py .
COPY services/ProgramsForRPI/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ServiceUtilities/ais_fetcher.py /audio_consumer/ServiceUtilities/

CMD [ "python", "ais_api_producer.py" ]