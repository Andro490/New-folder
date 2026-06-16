FROM node:22-alpine

# Prisma needs openssl on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package.json AND prisma schema BEFORE npm install
# (postinstall runs "prisma generate" which needs schema.prisma)
COPY package.json ./
COPY prisma ./prisma/

# Use npm install (not npm ci) to handle lock file differences
RUN npm install

# Copy remaining source files
COPY . .

# Build the frontend (React/Vite)
RUN npm run build

EXPOSE 3001

# At runtime: start server
ENV PRISMA_TELEMETRY_DISABLED=1
CMD ["node", "server.js"]
