FROM node:22-alpine

WORKDIR /app

# Copy package files only first (better layer caching)
COPY package.json ./

# Use npm install (not npm ci) to handle lock file differences
RUN npm install

# Copy all source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the frontend (React/Vite)
RUN npm run build

EXPOSE 3001

# At runtime: push schema then start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]
