FROM nginx:latest
# gettext for envsubst
RUN apt-get update && apt-get install -y gettext-base apache2-utils

# htpasswd for basic authentication
# format USERS=username1:password1,username2:password2,...
ARG USERS
RUN touch /etc/nginx/.htpasswd
RUN echo "$USERS" | tr ',' '\n' | while IFS=':' read un pw; do htpasswd -Bb /etc/nginx/.htpasswd "$un" "$pw"; done;
RUN cat /etc/nginx/.htpasswd

ARG SERVER
ENV SERVER=${SERVER}

# substitute environment variables from nginx template
ADD nginx.conf /etc/nginx/nginx.conf.template
RUN envsubst '$SERVER' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

RUN cat /etc/nginx/nginx.conf

# start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
