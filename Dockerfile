FROM node:20-slim

# Chromium dependencies (Remotion rendering needs headless Chrome)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer/Remotion where Chromium is
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
