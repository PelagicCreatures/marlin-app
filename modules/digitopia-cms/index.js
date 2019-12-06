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

module.exports = (app, options) => {

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
	usersApp.db = app.db;
	usersApp.router = router;

	for (let prop in defaults) {
		if (!usersApp.options[prop]) {
			usersApp.options[prop] = defaults[prop];
		}
	}

	require('./api-routes/is-unique.js')(usersApp);
	require('./api-routes/register.js')(usersApp);
	require('./api-routes/login.js')(usersApp);
	require('./api-routes/logout.js')(usersApp);
	require('./api-routes/email-change.js')(usersApp);
	require('./api-routes/email-validate.js')(usersApp);
	require('./api-routes/password-change.js')(usersApp);
	require('./api-routes/password-reset.js')(usersApp);
	require('./api-routes/password-set.js')(usersApp);
	require('./api-routes/token-delete.js')(usersApp);
	if (process.env.STRIPE_SECRET) {
		require('./api-routes/subscription-cancel.js')(usersApp);
		require('./api-routes/stripe-webhook.js')(usersApp);
	}

	app.use('/', require('./routes/user-ui-pages')(app));

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
