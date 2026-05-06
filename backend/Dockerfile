FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV ML_MODEL_PATH=/app/ml/crop_model.joblib
ENV ML_ENCODER_PATH=/app/ml/label_encoder.joblib

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
