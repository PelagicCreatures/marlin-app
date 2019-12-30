### Using certbot

Certbot is the easiest way to get and maintain an ssl cert for web services.

This assumes that your service is already running under supervisord

install certbot
```
sudo yum install -y certbot python2-certbot
```

Set up your environment to run on port 80, open your firewall for http and https and Start the webservice - it needs to be running and publicly accessible on the domain you want the cert for.

```
supervisorctl start <your service name>
```

get the cert: supply the host.domain and email address of the admin for the domain
```
ENVFILE=./environment-production.env CERTBOT_EMAIL=<admin email address> CERTBOT_HOSTNAME=<host.domain to secure> npm run getcert
```

getcert puts a file in the public directory which certbot then downloads to verify that you control the domain. It then saves the private key and cert on the server. This script then updates the environment file with the path to the keys so when the server is restarted it will use the certificate and run under https.

```
supervisorctl restart antisocial
```

You should now be able to contact the service using https. All http connections will redirect to https.

The system periodically runs `certbot renew` and restarts webservice if needed to keep the certificate fresh.
