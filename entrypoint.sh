#!/bin/bash

envsubst < /usr/share/nginx/html/assets/config/envvars.tpl.json > /usr/share/nginx/html/assets/config/envvars.json && nginx -g 'daemon off;'
#envsubst <  /app/mjs-webservice/static/assets/config/envvars.tpl.json >  /app/mjs-webservice/static/assets/config/envvars.json  && /app/mjs-webservice/run-mjs-webservice
