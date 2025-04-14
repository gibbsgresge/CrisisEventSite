# Use NVIDIA base with CUDA for LLMs
FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

# 1) Add MongoDB APT source
RUN apt-get update && apt-get install -y curl gnupg ca-certificates && \
    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg && \
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" \
    | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# 2) Install system dependencies + Ninja
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-dev \
    build-essential git wget \
    libssl-dev libffi-dev libgl1 \
    supervisor \
    ninja-build \
    && rm -rf /var/lib/apt/lists/*

# 3) Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && apt-get install -y nodejs

# 4) Install MongoDB & create data directory
RUN apt-get update && apt-get install -y mongodb-org
RUN mkdir -p /data/db && chown -R mongodb:mongodb /data/db

# Set working directory
WORKDIR /app

# Copy source files
COPY flask/ /app/flask/
COPY next-app/ /app/next-app/
COPY next-app/.env /app/next-app/.env

# Copy Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 5) Install Python dependencies (Flask + LLM stuff)
WORKDIR /app/flask
COPY flask/requirements.txt .
RUN pip3 install --upgrade pip && \
    pip3 install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cu121

# 6) Install Node dependencies & build Next.js
WORKDIR /app/next-app
RUN npm install && npm run build

# Expose ports for Flask, Next.js, MongoDB
EXPOSE 5000 3000 27017

# Run Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
