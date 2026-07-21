# Use Python 3.11 slim image (JAX will install its own CUDA wheels)
FROM python:3.11-slim

# Prevent interactive prompts during apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
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

# Install gsutil, wget and download the MT3 model checkpoint
RUN pip install gsutil
RUN apt-get update && apt-get install -y wget
RUN mkdir -p /app/checkpoints
RUN gsutil -q -m cp -r gs://mt3/checkpoints/mt3 /app/checkpoints/

# Download gin configs
RUN mkdir -p /app/gin
RUN wget https://raw.githubusercontent.com/magenta/mt3/main/mt3/gin/model.gin -O /app/gin/model.gin
RUN wget https://raw.githubusercontent.com/magenta/mt3/main/mt3/gin/mt3.gin -O /app/gin/mt3.gin

# Copy the API server code
COPY main.py .

# Expose port 5000 for the Node.js proxy to connect to
EXPOSE 5000

# Start the FastAPI server using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
