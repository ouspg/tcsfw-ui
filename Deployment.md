# Deployment

# Development setup

The TCSFW can be deployed for development using containers.
This is done by `docker-compose.yml` located in the project root.
Deployment uses three containers at the moment:

 - `api-server` TCSFW API built elsewhere.
 - `api-proxy` Nginx proxy for mediating API calls.
 - `web-server` Entry-point Vite http server in port 5173.

*NOTE: This setup is not suitable for production and to be exposed to public.*

## API server

API server image can be created by [TCSFW framework](https://github.com/ouspg/tcsfw) Dockerfile.

## API proxy

API proxy is using [Nginx](https://www.nginx.com/).
Nginx configuration is in `api-proxy/nginx.conf`. 

## Web server

Web server is running [Vite](https://vitejs.dev/) web server intended for development.
The server runs in port 5173.

## Creating development setup

With properly installed [Docker](https://www.docker.com/) and [Docker compose](https://docs.docker.com/compose/) plugin starting of the development setup is easy.

    $ docker compose up --build







 