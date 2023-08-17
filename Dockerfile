### STAGE 1: Build ###
# This image is around 53 megabytes
# https://hub.docker.com/_/node/tags?page=1&name=alpine
FROM node:18-alpine3.18 AS builder

# Create app directory
WORKDIR /app

# Copy all needed files from the repo to /app
COPY /public ./public
COPY /src ./src
COPY index.html .
COPY package*.json .
COPY tsconfig.json .
COPY vite.config.ts .

# Install app dependencies
RUN npm ci --verbose

# Build the ui
RUN npm run build

### STAGE 2: Run ###
# This image is around 5 megabytes
# https://hub.docker.com/_/nginx/tags?page=1&name=slim
FROM nginx:1.25-alpine3.18-slim

# Install Node.js LTS version needed for env variable generation
RUN apk add --update nodejs

COPY /nginx /etc/nginx/conf.d

EXPOSE 8080
EXPOSE 443

# Copy web application which was build in stage 1
COPY --from=builder /app/build /usr/share/nginx/html

# Environment variables adjust the running environment
COPY generate-env-browser.js /usr/share/nginx/html/generate-env-browser.mjs
COPY .env .

# Start Nginx server with override ENV variables script
CMD ["/bin/sh", "-c", "node /usr/share/nginx/html/generate-env-browser.mjs && nginx -g \"daemon off;\""]
