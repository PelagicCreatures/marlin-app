## Using letsencrypt

sudo yum install -y certbot python2-certbot

ENVFILE=./environment-local.env CERTBOT_EMAIL=some@email.address CERTBOT_HOSTNAME=hostname npm run getcert


ENVFILE=./environment-local.env CERTBOT_EMAIL=mrhodes@myantisocial.net CERTBOT_HOSTNAME=blog.myanti.social npm run getcert

service run under supervisord

service periodically runs renew and restarts if needed

supervisord.d/antisocial.ini
```
[program:antisocial]
autorestart=true
directory=/usr/local/testbench/user-boilerplate
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=ENVFILE="./environment-local.env"
command=/bin/npm run local
```
