FROM node:20-slim

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  wget \
  fonts-liberation \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnss3 \
  libx11-6 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libxrender1 \
  libxtst6 \
  xdg-utils \
  libasound2 \
  libgbm1 \
  libu2f-udev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN npm install

CMD ["npm", "start"]
