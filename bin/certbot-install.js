const path = require('path');
var exec = require('child_process').exec;

let variables = [
	'ENVFILE',
	'NODE_ENV',
	'PORT',
	'SSL_PORT',
	'DB_DIALECT',
	'DB_HOST',
	'DB_USER',
	'DB_PASSWD',
	'DB_DBNAME',
	'COOKIE_DOMAIN',
	'PUBLIC_HOST',
	'RECAPTCHA_PUBLIC',
	'RECAPTCHA_SECRET',
	'STRIPE_PUBLIC',
	'STRIPE_SECRET',
	'STRIPE_YEARLY',
	'STRIPE_MONTHLY',
	'BASIC_AUTH_USER_NAME',
	'BASIC_AUTH_PASSWORD',
	'SSL_KEY_PATH',
	'SSL_CERT_PATH',
	'CERTBOT',
	'CERTBOT_EMAIL',
	'CERTBOT_HOSTNAME',
	'SUPERVISOR_SERVICE_NAME',
	'TESTING'
]

if (!process.env.ENVFILE) {
	console.log('missing env ENVFILE');
	process.exit(0);
}

console.log('loading env:' + process.env.ENVFILE)
require('dotenv').config({
	path: process.env.ENVFILE
});

if(!process.env.CERTBOT_EMAIL || !process.env.CERTBOT_HOSTNAME) {
	console.log('missing env CERTBOT_EMAIL and/or CERTBOT_DOMAIN');
	exit(0);
}

var command = '/usr/local/bin/certbot-auto certonly --dry-run --debug --webroot -w ' + path.join(__dirname,'../','public') + ' -m ' + process.env.CERTBOT_EMAIL + ' -d ' + process.env.CERTBOT_HOSTNAME + ' --agree-tos';

console.log('executing: ' + command);

exec(command, function (err, stdout, stderr) {
	if (err) {
		console.log(err, stdout, stderr);
		exit(0);
	}

	process.env['SSL_KEY_PATH'] = '/etc/letsencrypt/live/' + process.env.CERTBOT_HOSTNAME + '/privkey.pem';
	process.env['SSL_CERT_PATH'] = '/etc/letsencrypt/live/' + process.env.CERTBOT_HOSTNAME + '/fullchain.pem';
	process.env['PUBLIC_HOST'] = 'https://' + process.env.CERTBOT_HOSTNAME;
	process.env['CERTBOT'] = 'true';

	var toSave = '';
	for (var prop in process.env) {
		if (variables.indexOf(prop) !== -1) {
			toSave += prop + '=' + process.env[prop] + '\n';
		}
	}

	fs.writeFile(process.env.ENVFILE, toSave, function (err) {
		if (err) {
			return res.sendStatus(500);
		}
		res.send('SSL configured. Restarting server - please wait a bit then <a href="https://' + domain + '/environment">Click Here</a> to continue.');
		process.exit();
	});
});
