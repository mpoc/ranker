FROM node:14-alpine

WORKDIR /usr/src/ranker

COPY package.json yarn.lock ./
RUN yarn install --production

# https://stackoverflow.com/a/57245802/12108012
COPY . .
RUN yarn build

EXPOSE 8000
ENTRYPOINT ["yarn", "start"]
