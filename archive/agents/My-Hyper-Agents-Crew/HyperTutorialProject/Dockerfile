FROM node:18-alpine

WORKDIR /app

# Copy package definition first for caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for tsx)
RUN npm ci

# Copy source code
COPY . .

# Default command
CMD ["npm", "run", "power-moves"]
