FROM node:20

# Create directories for both applications
WORKDIR /app
RUN mkdir backend frontend

# Backend setup
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/index.js ./

# Frontend setup
WORKDIR /app/frontend
COPY frontend/iclusterapp/package.json frontend/iclusterapp/package-lock.json ./
RUN npm ci
COPY frontend/iclusterapp/public ./public
COPY frontend/iclusterapp/src ./src

# Build the React app
RUN npm run build

# Expose ports (adjust if necessary)
EXPOSE 5038 3000 27017

# Create a start script
RUN echo '#!/bin/bash\ncd /app/backend && node index.js &\ncd /app/frontend && npm start' > /app/start.sh
RUN chmod +x /app/start.sh

# Set working directory to app root
WORKDIR /app

# Start both applications
CMD ["/app/start.sh"]