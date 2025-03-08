FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create environment file
RUN echo "VITE_BACKEND_URL=http://localhost:8080/api" > .env

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]