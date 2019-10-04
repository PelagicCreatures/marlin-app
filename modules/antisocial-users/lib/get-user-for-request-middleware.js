const debug = require('debug')('antisocial-user');
const VError = require('verror').VError;

function getUserForRequestMiddleware(userAPI) {

	let db = userAPI.db;

	// get token from headers or cookies and resolve the logged in user
	// if found set req.antisocialToken and req.antisocialUser for later use
	return function getUserForRequest(req, res, next) {
		var token;

		if (req.cookies && req.cookies['access-token']) {
			token = req.cookies['access-token'];
		}

		if (req.signedCookies && req.signedCookies['access-token']) {
			token = req.signedCookies['access-token'];
		}

		if (req.body && req.body['access-token']) {
			token = req.body['access-token'];
		}

		if (!token) {
			debug('getAuthenticatedUser no token in headers or cookies');
			return next();
		}

		debug('getAuthenticatedUser found token in header or cookies', token);

		db.getInstances('tokens', {
			'token': token
		}, function (err, tokenInstances) {
			if (err) {
				debug('getAuthenticatedUser error finding token', err.message);
				return next();
			}
			if (!tokenInstances || tokenInstances.length !== 1) {
				debug('getAuthenticatedUser token not found', tokenInstances);
				res.clearCookie('access-token', {
					'path': '/',
					'signed': true
				});
				return next();
			}

			debug('token: %j', tokenInstances[0]);

			validateToken(db, tokenInstances[0], function (err) {
				if (err) {
					return next(err);
				}

				db.getInstances('users', {
					'id': tokenInstances[0].userId
				}, function (err, userInstances) {
					if (err) {
						return next();
					}
					if (!userInstances || userInstances.length !== 1) {
						return next();
					}

					req.antisocialToken = tokenInstances[0];
					req.antisocialUser = userInstances[0];

					next();
				});

			});
		});
	};
}

// is the token valid?
function validateToken(db, token, cb) {
	var now = Date.now();
	var accessed = new Date(token.lastaccess).getTime();
	var elapsedSeconds = (now - accessed) / 1000;
	debug('validToken elapsed: %s ttl: %s', elapsedSeconds, token.ttl);
	if (elapsedSeconds < token.ttl) {
		touchToken(db, token, function (err) {
			cb(err);
		});
	}
	else {
		db.deleteInstance('tokens', token.id, function (err) {
			if (err) {
				return cb(new VError(err, 'token is expired'));
			}
			return cb(new VError('token is expired'));
		});
	}
}

// update lastaccess for rolling ttl
function touchToken(db, token, cb) {
	debug('touchToken %j', token);
	var now = Date.now();
	var accessed = new Date(token.lastaccess).getTime();
	var elapsedSeconds = (now - accessed) / 1000;

	// only update once an hr.
	if (elapsedSeconds < 3600) {
		return setImmediate(cb);
	}

	db.updateInstance('tokens', token.id, {
		'lastaccess': new Date()
	}, function (err) {
		if (err) {
			cb(new VError(err, 'touchToken failed'));
		}
		cb();
	});
}

export {
	getUserForRequestMiddleware, validateToken
};
