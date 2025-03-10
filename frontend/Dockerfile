FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# Build for production
RUN npm run build

# Install a static server to serve the build
RUN npm install -g serve

# Environment variable for backend URL
ENV VITE_BACKEND_URL=https://eduubserver.mano.systems/api

EXPOSE 5173

# Use serve to host the built app
CMD ["serve", "-s", "dist", "-l", "5173"]