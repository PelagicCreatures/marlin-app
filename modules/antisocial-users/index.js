const debug = require('debug')('antisocial-user');

const defaults = {
	DEFAULT_TTL: 1209600, // 2 weeks in seconds
	DEFAULT_SALT_ROUNDS: 10,
	DEFAULT_TOKEN_LEN: 64,
	PASSWORD_RESET_TTL: 3600 * 24 * 1, // 1 day
	EMAIL_CONFIRM_TTL: 3600 * 24 * 2, // 2 days
	MOUNTPOINT: '/api/users',
	RECAPTCHA: false
};

var express = require('express');
var events = require('events');

module.exports = (options, app, db) => {

	var router;

	if (app.loopback) {
		router = app.loopback.Router();
	}
	else {
		router = express.Router();
	}

	var usersApp = new events.EventEmitter();
	usersApp.options = options;
	usersApp.app = app;
	usersApp.db = db;
	usersApp.router = router;

	for (let prop in defaults) {
		if (!usersApp.options[prop]) {
			usersApp.options[prop] = defaults[prop];
		}
	}

	require('./routes/register.js')(usersApp);

	debug('mounting users API on ' + usersApp.options.MOUNTPOINT);

	if (usersApp.options.MOUNTPOINT) {
		app.use(usersApp.options.MOUNTPOINT, router);
	}
	else {
		app.use(router);
	}

	return usersApp;
};
