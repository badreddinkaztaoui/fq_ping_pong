FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./

RUN pnpm install

COPY . /app

EXPOSE 3000

CMD ["pnpm", "dev"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1