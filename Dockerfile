FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV CHROME_PATH=/usr/bin/chromium
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "chatbot.js"]
