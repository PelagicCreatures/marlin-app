const uid = require('uid2');
const VError = require('verror').VError;
const errorLog = require('debug')('errors');

module.exports = (usersApp) => {

	function createToken(user, options, done) {
		var guid = uid(usersApp.options.DEFAULT_TOKEN_LEN);
		usersApp.db.newInstance('tokens', {
			'userId': user.id,
			'token': guid,
			'ttl': options.ttl ? options.ttl : usersApp.options.DEFAULT_TTL,
			'lastaccess': new Date(),
			'created': new Date()
		}, function (err, user) {
			if (err) {
				var e = new VError(err, 'Could not create token');
				errorLog(e.message);
				return done(e);
			}
			done(null, user);
		});
	}

	return createToken;
};
