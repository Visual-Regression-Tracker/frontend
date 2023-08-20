### STAGE 1: Build ###
# This image is around 50 megabytes
FROM node:18-alpine3.18 AS builder

# Create app directory
WORKDIR /app

# Copy all files from the repo to /app
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
FROM nginx:1.25-alpine3.17-slim

COPY /nginx /etc/nginx/conf.d

EXPOSE 8080
EXPOSE 443

WORKDIR /usr/share/nginx/html

# Copy built source
COPY --from=builder /app/build .

# Copy override ENV script with default values
COPY ./env.sh .
COPY .env .

# Make our shell script executable
RUN chmod +x env.sh

# Start Nginx server with override ENV variables script
CMD ["/bin/sh", "-c", "/usr/share/nginx/html/env.sh && nginx -g \"daemon off;\""]