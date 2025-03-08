FROM node:18-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip python3-venv git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY package*.json ./
RUN npm install

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch==2.0.1 torchaudio==2.0.2 --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir numpy==1.23.5 && \
    pip install --no-cache-dir git+https://github.com/openai/whisper.git

COPY . .

RUN mkdir -p controllers/temp controllers/.model

ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 5000

CMD ["node", "server.js"]