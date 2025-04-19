FROM node:18-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Create .env file with environment variables
RUN echo "VITE_BACKEND_URL=http://167.71.229.78:5000/api" > .env

# Build the app
RUN npm run build

# Production stage using Nginx for serving static files
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]