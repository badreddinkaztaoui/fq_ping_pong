FROM nginx:alpine

RUN apk update && apk add curl bash

COPY ./conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY ./scripts/healthcheck.sh /healthcheck.sh

RUN chmod +x /healthcheck.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s CMD /healthcheck.sh

CMD ["nginx", "-g", "daemon off;"]
