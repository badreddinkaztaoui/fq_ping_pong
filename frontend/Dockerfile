FROM node:lts-alpine3.19

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json /app

RUN pnpm install

COPY . /app 

EXPOSE 3000

CMD ["pnpm", "dev"]
