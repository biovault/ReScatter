FROM alpine:latest
MAINTAINER Baldur van Lew <b.van_lew@lumc.nl>

RUN apk add --update \
    nginx \
  && rm -rf /var/cache/apk/*
RUN adduser www-data -G www-data -H -s /bin/false -D && mkdir /tmp/nginx/

ADD nginx.conf /etc/nginx/nginx.conf
ADD default.conf /etc/nginx/sites-enabled/default

EXPOSE 8081
EXPOSE 443

# VOLUME ["/var/www", "/var/log/nginx"]
VOLUME ["/var/log/nginx"]
WORKDIR /etc/nginx

# Copy the Rescatter example directory to the image
COPY ./ /var/www/
# List for visual check
RUN ls -la /var/www/*

CMD ["nginx"]

