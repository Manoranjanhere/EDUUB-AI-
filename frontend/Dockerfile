FROM node:18-slim AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install ALL dependencies including dev dependencies
RUN npm install

# Explicitly install vite and related packages
RUN npm install vite @vitejs/plugin-react --save-dev

# Copy the rest of your code
COPY . .

# Verify vite is installed
RUN ls -la node_modules/.bin/

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Configure nginx
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]