FROM node:9.2.0-alpine

# Setup a safe place to mount and do work in
RUN mkdir /app

# Setup a safe place to mount app/static to do the builds to
RUN mkdir /build

WORKDIR /app

RUN npm install

RUN cd frontend && npm install && cd ..

RUN npm install && npm install -g gulp-cli

RUN npm run postinstall
