### STAGE 1: Build ###
FROM node:12 AS builder

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

COPY /nginx/default.conf /etc/nginx/conf.d/default.conf
RUN chown -R nginx /etc/nginx /var/run /run

EXPOSE 8080

COPY --from=builder /app/build /usr/share/nginx/html