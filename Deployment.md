# Deployment

# Development setup

The TCSFW can be deployed for development using containers.
This is done by `docker-compose.yml` located in the project root.
Deployment uses three containers at the moment:

 - `api-server` Tcsfw API server with the appropriate security statement(s) built-in
 - `api-proxy` Nginx proxy for mediating API calls.
 - `web-server` Entry-point Vite http server in port 5173.

*NOTE: This setup is not suitable for production and to be exposed to public.*

## API server

API server image is created from the [Tcsfw](https://github.com/ouspg/tcsfw) as instructed in its documentation.
Adjust the container name to match the name you used.

## API proxy

API proxy is using [Nginx](https://www.nginx.com/).
Nginx configuration is in `api-proxy/nginx.conf`. 

The purpose of the API proxy is to redirect API calls into appropriate TCP ports, as each security statement instance is running in separate process with different ports from range 10000-19999.

## Web server

Web server is running [Vite](https://vitejs.dev/) web server intended for development.
The server runs in port 5173.

## Creating development setup

With properly installed [Docker](https://www.docker.com/) and [Docker compose](https://docs.docker.com/compose/) plugin starting of the development setup is easy.

    $ docker compose up --build

The API access token `TCSFW_SERVER_API_KEY` must be set, e.g. in `.env` file.
