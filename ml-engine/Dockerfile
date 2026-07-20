# Use NVIDIA CUDA base image to enable GPU access for JAX and TensorFlow
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Prevent interactive prompts during apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy dependencies list
COPY requirements.txt .

# Upgrade pip and install Python packages
RUN python3 -m pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the API server code
COPY main.py .

# Expose port 5000 for the Node.js proxy to connect to
EXPOSE 5000

# Start the FastAPI server using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
