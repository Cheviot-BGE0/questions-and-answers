# syntax=docker/dockerfile:1
from node:17-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=prod
COPY . .
EXPOSE 3000
RUN chmod +x server/setup.sh
CMD ./server/setup.sh ; node server