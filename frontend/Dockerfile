FROM node:18-slim AS build

# Accept build argument for backend URL
ARG VITE_BACKEND_URL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Create .env file with environment variables from build arg
RUN echo "VITE_BACKEND_URL=${VITE_BACKEND_URL}" > .env

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