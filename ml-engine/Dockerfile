# Use Python 3.11 slim image (JAX will install its own CUDA wheels)
FROM python:3.11-slim

# Prevent interactive prompts during apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy dependencies list
COPY requirements.txt .

# Upgrade pip and install Python packages
RUN python3 -m pip install --upgrade pip
RUN pip install -r requirements.txt

# No need for MT3 gsutil download anymore, demucs downloads on the fly (or basic pitch)

# Copy the API server code
COPY main.py .

# Expose port 5000 for the Node.js proxy to connect to
EXPOSE 5000

# Start the FastAPI server using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
