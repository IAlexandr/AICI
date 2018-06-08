# SERVER
FROM node:6.14.2-alpine

ARG DIR=/home/deql-ms

ADD package.json $DIR/
ADD ./server/package.json $DIR/server/
ADD ./server/deql-ms-server/package.json $DIR/server/deql-ms-server/
WORKDIR $DIR
RUN npm install yarn -g
RUN chmod +x /usr/local/bin/yarn
RUN yarn global add concurrently
RUN yarn global add babel-cli
RUN yarn
RUN apk update
RUN apk upgrade
RUN apk add bash
RUN apk add git
RUN yarn run init_server

COPY ./server $DIR/server
COPY ./config $DIR/config
COPY ./package.json $DIR/package.json

ENV DEBUG deql*
CMD ["yarn", "run", "server_prod"]
