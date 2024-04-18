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

Now you should be able to start the development web-server in localhost to try you the UI.
```
$ npm run dev
```
This should open up HTTPS service to https://localhost:5173/.
The service is only available from the local machine.

The framework and UI can [deployed](Deployment.md) using Docker compose for development purposes.