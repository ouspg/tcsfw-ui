# Tcsfw-ui

User Interface for [Transparent Cybersecurity Framework](https://github.com/ouspg/tcsfw).
The UI is created with [Vue 3](https://vuejs.org/).

This project also includes instructions for developent [deployment](Deployment.md) of the Tcsfw
server using Docker.
Tcsfw server can be ran directly from host machine, check [TCSFW](https://github.com/ouspg/tcsfw) documentation.

## Installation

You need [Node.js](https://nodejs.org/). Check its documentation for installation instructions.
Once you have Node.js installed clone this project.
```
$ git clone git://git@github.com/ouspg/tcsfw-ui.git
...
$ cd tcsfw-ui
```

Now Node.js should be able to do the heavy lifting for you to install the other dependencies: [Vue 3](https://vuejs.org/) and [Vite](https://vitejs.dev/).
```
$ npm install
```

## Generating keys

You have to create self-signed certificate and the matching private key for TLS service. 
For example, the [OpenSSL](https://www.openssl.org/) tool can be used.
The private key can be generated like below.
```
$ openssl genpkey -algorithm RSA -out server.key -pkeyopt rsa_keygen_bits:2048
```
And the self-signed certificate with the following command line.
```
$ openssl req -new -x509 -key server.key -out server.crt -days 365
```
Please, check OpenSSL documentation or other source for more information. However, for simple testing you should now have `server.key` and `server.crt`. Place them into `ssl/` directory in the project root.
```
$ ls ssl/
server.crt  server.key
```

## Running the server

The framework and UI can [deployed](Deployment.md) using Docker compose for development purposes.
At this point, the deployment is not ready for Internet-exposure.

### UI and stand-alone API server

You can run the UI with a stand-alone API server started in following manner (see  [Tcsfw](https://github.com/ouspg/tcsfw) documentation):

    $ TCSFW_SERVER_API_KEY=<key> python <statement.py> --http-server 8180

Now you should be able to start the development web-server in localhost to try you the UI.

    $ npm run dev

This should open up HTTPS service to `https://localhost:5173/login/statement/<statement>?api_key=<key>`.
You must give the API key in the URL, which is only good for development purposes.
The server URL can be changed by environment variable `VITA_API_PROXY`.

### UI, proxy, and stand-alone API launcher

In slightly more complex setup, API server runs _launcher_, Nginx proxy is running in container and UI connects into it.

The launcher is part of the Tcsfw and it is run this way:

    $ python tcsfw/launcher.py

As default, it listens in port 8180.
The proxy is built and started like this:

    $ cd api-proxy/
    $ docker build -t test/api-proxy --build-arg "SERVER=172.17.0.1" \
       --build-arg "USERS=user1:pass1"

The `Dockerfile` for the proxy is in `api-proxy/` directory, which contains also other required files.
The build argument `SERFVER` gives the API server, which should be the address of the host in the docker-space (it may be different than which is used in example).
The build agument `USERS` list the names and passwords of the test users.

The proxy can now be started like this and it should listen in port 8181:

    $ docker run --rm -p 8181:8181 test/api-proxy

This change in port must be reflected in UI:

    $ VITA_API_PROXY=http://localhost:8181 npm run dev
