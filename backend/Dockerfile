FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY . .

# Create upload storage directories
RUN mkdir -p uploads/mri_scans uploads/gradcam uploads/reports && chmod -R 777 uploads

# Hugging Face default container port is 7860
EXPOSE 7860

# Run pure FastAPI master application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
