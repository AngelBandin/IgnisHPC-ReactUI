FROM node:20

# Install MongoDB
RUN wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_amd64.deb
RUN dpkg -i libssl1.1_1.1.1f-1ubuntu2_amd64.deb

RUN apt-get update && apt-get install -y wget gnupg
RUN wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
RUN apt-get update && apt-get install -y mongodb-org

# Create directories for backend, frontend, and MongoDB
WORKDIR /app
RUN mkdir backend frontend data

# Backend setup
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend .

# Frontend setup
WORKDIR /app/frontend
COPY frontend/iclusterapp/package*.json ./
RUN npm ci
COPY frontend/iclusterapp/public ./public
COPY frontend/iclusterapp/src ./src

# Build React app
RUN npm run build

#FROM node:20-slim

# Install MongoDB
#RUN apt-get update && apt-get install -y wget gnupg
#RUN wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
#RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
#RUN apt-get update && apt-get install -y mongodb-org

WORKDIR /app

# Copy backend
#COPY --from=build /app/backend ./backend

# Copy frontend build
#COPY --from=build /app/frontend/build ./frontend/build

# Set environment variables
ENV PORT=5038
#ip o localhost por defecto
ENV MONGODB_URI="mongodb://localhost:27017"
ENV DATABASE_NAME="DB_pruebas"

# Expose ports
EXPOSE ${PORT}  27017

# Set working directory to app root
CMD ["bash", "-c", "echo '#!/bin/bash\n\
mongod --dbpath /app/data &\n\
sleep 5\n\
mongosh '$DATABASE_NAME' --eval \"db.createCollection(\"ICluster\")\" &\n\
cd /app/backend && node index.js &\n\
cd /app/frontend && npx serve -s build -l 3000'> /app/start.sh && chmod +x /app/start.sh && /app/start.sh"]
