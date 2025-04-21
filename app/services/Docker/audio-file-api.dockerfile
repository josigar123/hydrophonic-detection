FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && \
    rm -rf /var/lib/apt/lists/*

# Copy the Api folder
COPY services/Apis /app/services/Apis

COPY configs /app/configs

# Copy the db code
COPY services/Database/minio_handler.py /app/services/Database/minio_handler.py

RUN pip install --no-cache-dir -r /app/services/Apis/requirements.txt

WORKDIR /app/services

EXPOSE 8000

# Run the API and expose endpoints
CMD [ "python", "-m", "uvicorn", "Apis.main:app", "--reload" ]