const debug = require('debug')('antisocial-db-events');

module.exports = (userAPI) => {
	userAPI.on('didRegister', (user, post, cb) => {
		debug('didRegister event user: %j', user);
		cb();
	})

	userAPI.on('sendEmailConfirmation', function (user, token) {
		debug('sendEmailConfirmation event user: %j token: %j', user, token);
	});

	userAPI.on('sendPasswordReset', function (user, token) {
		debug('sendPasswordReset user: %j token: %j', user, token);
	});

	userAPI.db.on('db-create', function (table, instance) {
		debug('db-create %s instance id %s', table, instance.id);
	});

	userAPI.db.on('db-update', function (table, instance) {
		debug('db-update %s instance id %s', table, instance.id);
	});

	userAPI.db.on('db-delete', function (table, instance) {
		debug('db-delete %s instance id %s', table, instance.id);
	});
}
