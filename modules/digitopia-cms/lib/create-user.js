const errorLog = require('debug')('errors');
const VError = require('verror').VError;

module.exports = (usersApp) => {

	function createUser(params, done) {
		const saltAndHash = require('./salt-and-hash')(usersApp);

		usersApp.db.newInstance('User', {
			name: params.name,
			username: params.username,
			email: params.email,
			password: saltAndHash(params.password),
			created: new Date(),
			pendingEmail: params.email
		}, function (err, user) {
			if (err) {
				var e = new VError(err, 'Could not create user');
				errorLog(e.message);
				return done(e);
			}
			done(null, user);
		});
	}

	return createUser;
};
