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
The default API server contains only the `samples/` security statements.
Look at aformentioned documentation for instructions how to build the container with your own security statements.
Adjust the container name in `docker-compose.yaml` to match the name you used.

## API proxy

API proxy is using [Nginx](https://www.nginx.com/).
Nginx configuration is in `api-proxy/nginx.conf`. 

The proxy performs simple HTTP _basic authentication_ for hard-coded user credentials, names and passwors. The credentials are defined in file `.env` like one below and embedded into the server Docker image.

    USERS=username1:password1,username2:password2

The authentication is performed when API user performs login into security statement, e.g. when the web server is running in `localhost:5173`, the URL for Ruuvi sample project is the following.

    https://localhost:5173/login/samples/ruuvi/ruuvi

If the authentication is succesful, the API server responds with endpoint information, such as:

    {"api_proxy": 10000, "api_key": "<api-key>"}

The endpoint infomation is not a port number, e.g. "`10000`", but it can contain host name in the future.

After authentication the proxy redirects API calls into appropriate TCP ports, as each security statement instance is running in separate process with different ports from range 10000-19999. 
The `api_key` must be in Cookie `authorizatoin=<api-key>;path=/` or HTTP header `A-authorization=<api-key>`.

Proxy redirects URLs into corrent API server process using two different schemes, API caller can choose which one to use.
Firstly, the endpoint information can be in custom HTTP header, e.g. `X-Endpoint: 10000`. Secondly, it can be embedded into request URL starting e.g. with `/proxy/10000/` or `/proxy/ws/10000`.


## Web server

Web server is running [Vite](https://vitejs.dev/) web server intended for development.
The server runs in port 5173.
The server is not ready for Internt-exposure.

## Creating development setup

With properly installed [Docker](https://www.docker.com/) and [Docker compose](https://docs.docker.com/compose/) plugin starting of the development setup is easy.

    $ docker compose up --build

Remeber to configure it by file `.env` as instructed.