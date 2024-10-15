FROM node:17-alpine AS builder
WORKDIR /usr/src/ranker
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:17-alpine
WORKDIR /usr/src/ranker
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean
COPY --from=builder /usr/src/ranker/dist ./dist
EXPOSE 8000
ENTRYPOINT ["yarn", "start"]
