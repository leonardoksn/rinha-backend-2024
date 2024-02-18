FROM node:20-alpine3.18 as build-server
WORKDIR /app
COPY . /app

FROM node:18.16.1-bullseye-slim

WORKDIR /server

COPY --from=build-server /app/src .
COPY ["package.json",".env","package-lock.json", "./"]

RUN ls -a

RUN npm install

RUN ls -a

ENV TZ=America/Sao_Paulo \
    DEBIAN_FRONTEND=noninteractive

EXPOSE 3030

CMD ["npm", "start"]
