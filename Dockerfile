FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for PyTorch/SimpleITK)
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ /app/

# Create upload directories
RUN mkdir -p uploads/mri_scans uploads/gradcam uploads/reports

EXPOSE 7860

# Run uvicorn on Hugging Face's default port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
