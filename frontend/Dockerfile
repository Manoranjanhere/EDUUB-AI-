FROM node:18-slim

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies including react-router-dom
RUN npm install

# Copy application code
COPY . .

# Create environment variables file
ENV VITE_BACKEND_URL=http://64.227.152.247:5000/api

EXPOSE 5173

# Command to run the app
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]