# lts-gallium refers to v16
# Using this instead of node:16 to avoid dependabot updates
FROM node:lts-gallium as builder

WORKDIR /usr/src/app
RUN npm config set registry http://registry.npmmirror.com/
RUN npm i pnpm -g
COPY package.json pnpm-lock.yaml ./
RUN pnpm config set registry http://registry.npmmirror.com/
RUN pnpm install
# RUN npm ci

COPY . .

ARG APP_ENV=development
ENV NODE_ENV=${APP_ENV}

RUN pnpm build

RUN pnpm prune

FROM node:lts-gallium

ARG APP_ENV=development
ENV NODE_ENV=${APP_ENV}

WORKDIR /usr/src/app
RUN npm config set registry http://registry.npmmirror.com/
RUN npm i pnpm -g
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

USER node
CMD [ "pnpm", "run", "start:prod" ]
# CMD [ "pnpm", "run", "start" ]