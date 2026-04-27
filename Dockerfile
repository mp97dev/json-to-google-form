FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json backend/
COPY frontend/package*.json frontend/
COPY cli/package*.json cli/

RUN npm ci

COPY . .

RUN npm run build -w backend && npm run build -w frontend

FROM node:20-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends nginx gettext-base \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/backend/dist /app/backend/dist
COPY --from=build /app/frontend/dist/frontend/browser /srv/frontend

COPY deploy/nginx/default.conf.template /app/deploy/nginx/default.conf.template
COPY deploy/start.sh /app/deploy/start.sh

RUN chmod +x /app/deploy/start.sh

ENV NODE_ENV=production
ENV PORT=8080
ENV BACKEND_PORT=3000

EXPOSE 8080

CMD ["/app/deploy/start.sh"]
