const uid = require('uid2');
const VError = require('verror').VError;
const errorLog = require('debug')('errors');

module.exports = (usersApp) => {

	function createToken(user, options, done) {
		let guid = uid(usersApp.options.DEFAULT_TOKEN_LEN);
		let ttl = options.ttl ? options.ttl : usersApp.options.DEFAULT_TTL;

		let nowInSeconds = Math.round(new Date().getTime() / 1000);
		let expires = nowInSeconds + ttl;

		usersApp.db.newInstance('Token', {
			userId: user.id,
			token: guid,
			ttl: options.ttl ? options.ttl : usersApp.options.DEFAULT_TTL,
			expires: expires,
			lastaccess: new Date(),
			type: options.type ? options.type : 'access',
			ip: options && options.ip ? options.ip : null
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
