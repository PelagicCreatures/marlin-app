var cron = require('node-cron');
var debug = require('debug')('tasks');
var exec = require('child_process').exec;

module.exports = function autopost(server) {
	if (!process.env.CERTBOT || !process.env.SUPERVISOR_SERVICE_NAME) {
		return;
	}
	debug('starting letsencrypt renewal daemon');
	cron.schedule('0 3 * * *', function () {
		var command = '/usr/bin/certbot --no-bootstrap renew --deploy-hook "supervisorctl restart ' + process.env.SUPERVISOR_SERVICE_NAME + '"';
		exec(command, function (err, stdout, stderr) {});
	});
};
