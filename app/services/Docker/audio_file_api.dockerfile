FROM python:3.13-slim

WORKDIR /app

# Update and clean up apt cache (optional unless you need OS packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy API code
COPY services/Apis /app/services/Apis

# Copy the config directory and MinIO config
COPY configs /app/configs

# Copy the database handler
COPY services/Database/minio_handler.py /app/services/Database/minio_handler.py

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/services/Apis/requirements.txt

WORKDIR /app/services

EXPOSE 8000

# Start FastAPI with Uvicorn
CMD ["uvicorn", "Apis.main:app", "--host", "0.0.0.0", "--port", "8000"]
