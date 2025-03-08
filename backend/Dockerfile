FROM nikolaik/python-nodejs:python3.10-nodejs18-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg build-essential python3-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Special approach for whisper that avoids dependency conflicts
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir torch==1.13.1 torchvision==0.14.1 torchaudio==0.13.1 --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip3 install --no-cache-dir triton==2.0.0 numpy==1.23.5 && \
    pip3 install --no-cache-dir git+https://github.com/openai/whisper.git

# Copy application code
COPY . .

# Create necessary temp directories
RUN mkdir -p controllers/temp controllers/.model

EXPOSE 5000

CMD ["node", "server.js"]