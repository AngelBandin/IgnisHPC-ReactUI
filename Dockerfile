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

# Create script to generate env config
RUN echo "window._env_ = {" > ./public/env-config.js && \
    echo "  REACT_APP_HOST_PORT: '5038'" >> ./public/env-config.js && \
    echo "};" >> ./public/env-config.js

# Add script reference to index.html
RUN sed -i '/<head>/a \    <script src="%PUBLIC_URL%/env-config.js"></script>' ./public/index.html

# Create runtime env update script
RUN echo "#!/bin/sh" > /app/update-env.sh && \
    echo "echo \"window._env_ = {\" > /app/frontend/build/env-config.js" >> /app/update-env.sh && \
    echo "echo \"  REACT_APP_HOST_PORT: '\$REACT_APP_HOST_PORT'\" >> /app/frontend/build/env-config.js" >> /app/update-env.sh && \
    echo "echo \"};\" >> /app/frontend/build/env-config.js" >> /app/update-env.sh && \
    chmod +x /app/update-env.sh

# Build React app
RUN npm run build

WORKDIR /app

# Expose ports
EXPOSE 5038 27017

# Modified start script to include env update
CMD ["bash", "-c", "echo '#!/bin/bash\n\
/app/update-env.sh\n\
mongod --dbpath /app/data &\n\
sleep 5\n\
mongosh IgnisDB --eval \"db.createCollection(\"Jobs\")\" &\n\
cd /app/backend && node index.js &\n\
cd /app/frontend && npx serve -s build -l 3000'> /app/start.sh && chmod +x /app/start.sh && /app/start.sh"]