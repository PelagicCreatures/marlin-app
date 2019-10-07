const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const async = require('async');

const {
	validateToken
} = require('../lib/get-user-for-request-middleware');

const {
	check, validationResult
} = require('express-validator');

module.exports = (usersApp) => {

	debug('mounting users API /password-set');

	let db = usersApp.db;

	const saltAndHash = require('../lib/salt-and-hash')(usersApp);

	usersApp.router.post('/password-set',

		check('token').isLength({
			min: 64
		}),

		check('password')
		.custom(value => !/\s/.test(value)).withMessage('No spaces are allowed in the password')
		.isLength({
			min: 8
		}).withMessage('password must be at least 8 characters')
		.matches('[0-9]').withMessage('password must have at least one number')
		.matches('[a-z]').withMessage('password must have at least one lowercase character')
		.matches('[A-Z]').withMessage('password must have at least one uppercase character'),

		function (req, res) {

			var errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422)
					.json({
						status: 'error',
						errors: errors.array()
					});
			}

			if (!req.body.token) {
				return res.status(422)
					.json({
						status: 'error',
						errors: [{
							msg: 'token is required'
						}]
					});
			}

			async.waterfall([
				function findToken(cb) {
					db.getInstances('tokens', {
						'token': req.body.token
					}, function (err, tokenInstances) {
						if (err) {
							return cb(new VError(err, 'error reading token'));
						}
						if (!tokenInstances || tokenInstances.length !== 1) {
							return cb(new VError('token not found'));
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
				function savePassword(token, user, cb) {
					db.updateInstance('users', user.id, {
						'password': saltAndHash(req.body.password)
					}, function (err, updated) {
						if (err) {
							return db(new VError('unable to save password'));
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
				if (err) {
					return res.status(401).json({
						status: 'error',
						errors: [{
							msg: err.message
						}]
					});
				}
				res.json({
					'status': 'ok',
					'flashLevel': 'success',
					'flashMessage': 'Password Saved!'
				});
			});
		});
};
