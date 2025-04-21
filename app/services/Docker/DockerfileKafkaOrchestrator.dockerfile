FROM python:3.10-slim

WORKDIR /orchestrator

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    portaudio19-dev \
    python3-pyaudio \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /orchestrator/

CMD [ "python", "kafka_orchestrator.py" ]