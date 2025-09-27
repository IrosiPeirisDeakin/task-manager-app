FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (prod + dev) inside the container
RUN npm ci

# Copy application code
COPY . .

# Environment
ENV NODE_ENV=production
EXPOSE 3000

# Default start command
CMD ["node", "src/index.js"]
