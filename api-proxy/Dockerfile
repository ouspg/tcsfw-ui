FROM nginx:latest
# gettext for envsubst
RUN apt-get update && apt-get install -y gettext-base

# nginx configuration template
ADD nginx.conf /etc/nginx/nginx.conf.template

ARG SERVER
ENV SERVER=${SERVER}

# substitute environment variables
RUN envsubst '$SERVER' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

RUN cat /etc/nginx/nginx.conf

# start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
