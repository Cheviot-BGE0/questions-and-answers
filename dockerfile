# syntax=docker/dockerfile:1
from node:17-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=prod
COPY . .
EXPOSE 3000
CMD node server