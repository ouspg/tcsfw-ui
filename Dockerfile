FROM node:16-alpine as build-stage

WORKDIR /app

# copy package.json and package-lock.json
COPY package*.json ./

# install project dependencies
RUN npm install

# copy the project files into the Docker image
COPY src src
COPY public public
COPY *.html .
COPY LICENSE .
COPY vite.config.js vite.config.js

# copy SSL certificates
COPY ssl/server.key ssl/server.crt ./ssl/

# expose service port
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
