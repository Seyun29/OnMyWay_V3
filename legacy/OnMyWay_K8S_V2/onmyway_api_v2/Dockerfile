FROM node:18.16.1-alpine

LABEL authors="Seyun Jang"

WORKDIR /app

COPY package.json /app
COPY pnpm-lock.yaml /app

RUN npm install pnpm -g

RUN npm install pm2 -g

RUN pnpm install

COPY . /app

EXPOSE 80

CMD ["pnpm", "start:prod"]