FROM nikolaik/python-nodejs:python3.10-nodejs18-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache ffmpeg

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Install Python dependencies
RUN pip3 install --break-system-packages openai-whisper

# Copy application code
COPY . .

# Create necessary temp directories
RUN mkdir -p controllers/temp controllers/.model

EXPOSE 5000

CMD ["node", "server.js"]