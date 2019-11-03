const debug = require('debug')('antisocial-user');

const {
	expireTokens
} = require('./lib/get-user-for-request-middleware');


const defaults = {
	DEFAULT_TTL: 3600 * 24 * 14, // 2 weeks in seconds
	DEFAULT_SALT_ROUNDS: 10,
	DEFAULT_TOKEN_LEN: 64,
	PASSWORD_RESET_TTL: 3600 * 24 * 1, // 1 day
	EMAIL_CONFIRM_TTL: 3600 * 24 * 2, // 2 days
	MOUNTPOINT: '/api/users'
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

	require('./routes/is-unique.js')(usersApp);
	require('./routes/register.js')(usersApp);
	require('./routes/login.js')(usersApp);
	require('./routes/logout.js')(usersApp);
	require('./routes/email-change.js')(usersApp);
	require('./routes/email-validate.js')(usersApp);
	require('./routes/password-change.js')(usersApp);
	require('./routes/password-reset.js')(usersApp);
	require('./routes/password-set.js')(usersApp);
	require('./routes/token-delete.js')(usersApp);
	if (process.env.STRIPE_SECRET) {
		require('./routes/subscription-cancel.js')(usersApp);
		require('./routes/stripe-webhook.js')(usersApp);
	}

	expireTokens(usersApp);

	debug('mounting users API on ' + usersApp.options.MOUNTPOINT);

	if (usersApp.options.MOUNTPOINT) {
		app.use(usersApp.options.MOUNTPOINT, router);
	}
	else {
		app.use(router);
	}

	return usersApp;
};
