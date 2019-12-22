## Using letsencrypt

install supervisord if not preinstalled

install certbot
```
sudo yum install -y certbot python2-certbot
```

in this example the service name is antisocial

save in supervisord.d/antisocial.ini
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

Set up your environment to run on port 80, open your firewall and Start the webservice - it needs to be running and publicly accessible on the domain you want the cert for.
```
supervisorctl start antisocial
```

get the cert:
```
ENVFILE=./environment-local.env CERTBOT_EMAIL=some@email.address CERTBOT_HOSTNAME=hostname npm run getcert
```

this puts a key in the public directory which certbot downloads to verify that you control the domain. It then puts the key and cert on the server. This script then updates the environment file with the path to the keys so when the server is restarted it will use the certificate and run under https.

the system periodically runs certbot renew and restarts webservice if needed (set SUPERVISOR_SERVICE_NAME to the service name)
