### STAGE 1: Build ###
# This image is around 50 megabytes
FROM node:18-alpine3.18 AS builder

# Environment variable generation script needs bash
RUN apk add --no-cache bash

# Create app directory
WORKDIR /app

# Copy all files from the repo to /app
COPY . .

# Install app dependencies
RUN npm ci --verbose

# Build the ui
RUN npm run build

# Create environment variable js file
RUN chmod +x env.sh && ./env.sh

### STAGE 2: Run ###
# This image is around 5 megabytes
FROM nginx:1.25-alpine3.17-slim

COPY /nginx /etc/nginx/conf.d

EXPOSE 8080
EXPOSE 443

COPY --from=builder /app/build /usr/share/nginx/html
COPY --from=builder /app/env-config.js /usr/share/nginx/html/

# Nginx server will now start automatically.
