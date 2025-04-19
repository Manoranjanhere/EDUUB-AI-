FROM node:18-slim

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Create .env file with environment variables
RUN echo "VITE_BACKEND_URL=http://167.71.229.78:5000/api" > .env

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]