const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const async = require('async');

const {
	validateToken
} = require('../lib/get-user-for-request-middleware');

module.exports = (usersApp) => {

	debug('mounting users API /validate-email');

	let db = usersApp.db;

	usersApp.router.get('/validate-email', function (req, res) {
		if (!req.query.token) {
			return res.status(422).json({
				status: 'error',
				errors: [{
					msg: 'token are required'
				}]
			});
		}

		async.waterfall([
			function findToken(cb) {
				db.getInstances('tokens', {
					'token': req.query.token
				}, function (err, tokenInstances) {
					if (err) {
						return cb(new VError(err, 'error reading token'));
					}
					if (!tokenInstances || tokenInstances.length !== 1) {
						return cb(new VError('Validation code was not found or has expired, please select "resend" to check your email address and get a new code.'));
					}

					validateToken(db, tokenInstances[0], function (err) {
						if (err) {
							return cb(err);
						}
						cb(null, tokenInstances[0]);
					});
				});
			},
			function readUser(token, cb) {
				db.getInstances('users', {
					'id': token.userId
				}, function (err, userInstances) {
					if (err) {
						return cb(new VError('error reading user'));
					}
					if (!userInstances || userInstances.length !== 1) {
						return cb(new VError('user not found'));
					}

					cb(null, token, userInstances[0]);
				});
			},
			function saveValidated(token, user, cb) {
				db.updateInstance('users', user.id, {
					'validated': true,
					'email': user.pendingEmail ? user.pendingEmail : user.email,
					'pendingEmail': null
				}, function (err, updated) {
					if (err) {
						return cb(new VError('unable to save validation status'));
					}
					cb(null, token, updated);
				});
			},
			function deleteToken(token, user, cb) {
				db.deleteInstance('tokens', token.id, function (err) {
					if (err) {
						return cb(new VError(err, 'could not delete token'));
					}
					return cb(null, user);
				});
			}
		], function (err, user) {
			let redirect = req.query.redirect ? req.query.redirect : '/users/home';
			if (err) {
				return res.redirect(redirect + '?flash=' + encodeURIComponent(err.message));
			}
			res.redirect(redirect + '?flash=' + encodeURIComponent('Your account is now activated!'));
		});
	});
};
