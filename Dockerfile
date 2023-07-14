### STAGE 1: Build ###
FROM node:16 AS builder

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

COPY . .

RUN npm run build

### STAGE 2: Run ###
FROM nginx:alpine

RUN apk add --no-cache bash

COPY /nginx /etc/nginx/conf.d
RUN chown -R nginx /etc/nginx /var/run /run

EXPOSE 8080
EXPOSE 443

COPY --from=builder /app/build /usr/share/nginx/html

# Copy .env file and shell script to container
WORKDIR /usr/share/nginx/html
COPY .env .
COPY ./env.sh .
RUN chmod +x env.sh

RUN adduser -D app
RUN chown -R app:app . && \
    chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    chown -R app:app /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R app:app /var/run/nginx.pid
USER app

# Start Nginx server
CMD ["/bin/bash", "-c", "/usr/share/nginx/html/env.sh && nginx -g \"daemon off;\""]
