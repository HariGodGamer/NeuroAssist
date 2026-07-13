FROM python:3.11-slim

# Create a user with UID 1000
RUN useradd -m -u 1000 user

WORKDIR /home/user/app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY --chown=user:user backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY --chown=user:user backend/ /home/user/app/

# Create upload directories and ensure writable permissions
RUN mkdir -p uploads/mri_scans uploads/gradcam uploads/reports && \
    chmod -R 777 uploads

# Redirect cache directories to writable /tmp
ENV HF_HOME=/tmp/hf_cache \
    TORCH_HOME=/tmp/hf_cache/torch

# Switch to the non-root user
USER user

EXPOSE 7860

# Run uvicorn on Hugging Face's default port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
