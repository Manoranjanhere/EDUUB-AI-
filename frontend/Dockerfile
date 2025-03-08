FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV VITE_BACKEND_URL=http://64.227.152.247:5000/api

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]