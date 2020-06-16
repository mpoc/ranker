FROM node:14-alpine as builder
WORKDIR /usr/src/ranker
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM node:14-alpine
WORKDIR /usr/src/ranker
COPY package.json yarn.lock ./
RUN yarn install --production --pure-lockfile
COPY --from=builder /usr/src/ranker/dist ./dist
EXPOSE 8000
ENTRYPOINT ["yarn", "start"]
