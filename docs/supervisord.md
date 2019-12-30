### supervisord

The easiest way to run this on an AWS instance.

install supervisord if not preinstalled

save in /etc/supervisord.d/antisocial.ini (in this example the service name is antisocial change as needed)
```
[program:antisocial]
autorestart=true
directory=/usr/local/testbench/user-boilerplate
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=ENVFILE="./environment-production.env"
command=/bin/npm run local
```

Create your environment file in the project root /environment-production.env
```
ENVFILE=./environment-production.env
NODE_ENV=production
PORT=80
SUPERVISOR_SERVICE_NAME=<your service name>
```

Start the service
```
supervisorctl start <your service name>
```
