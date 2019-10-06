const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const async = require('async');

const {
	check, validationResult
} = require('express-validator');

module.exports = (usersApp) => {

	debug('mounting users API /login');

	let db = usersApp.db;
	let createToken = require('../lib/create-token.js')(usersApp);
	let passwordMatch = require('../lib/password-match.js');

	usersApp.router.post('/login',
		check('email').isEmail(),

		check('password')
		.custom(value => !/\s/.test(value)).withMessage('No spaces are allowed in the password')
		.isLength({
			min: 8
		}).withMessage('password must be at least 8 characters')
		.matches('[0-9]').withMessage('password must contain a number')
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

			async.waterfall([
				function (cb) {
					db.getInstances('users', {
						'email': req.body.email
					}, function (err, userInstances) {
						if (err) {
							return cb(err);
						}

						if (!userInstances || userInstances.length !== 1) {
							return cb(new VError('user not found'));
						}

						var user = userInstances[0];
						cb(null, user);
					});
				},
				function (user, cb) {
					passwordMatch(req.body.password, user, function (err, isMatch) {
						if (err) {
							return cb(err);
						}

						if (!isMatch) {
							return cb(new VError('password mismatch'));
						}

						cb(null, user);
					});
				},
				function (user, cb) {
					createToken(user, {}, function (err, token) {
						cb(err, user, token);
					});
				}
			], function (err, user, token) {
				if (err) {
					return res.status(401).json({
						status: 'error',
						flashLevel: 'danger',
						flashMessage: 'Login failed',
						errors: [{
							msg: err.message
						}]
					});
				}

				res.cookie('access-token', token.token, {
						'path': '/',
						'maxAge': token.ttl * 1000,
						'signed': true
					})
					.send({
						'status': 'ok',
						'flashLevel': 'success',
						'flashMessage': 'Hello Again!',
						'result': {
							'id': user.id,
							'name': user.name,
							'username': user.username,
							'email': user.email,
							'validated': user.validated
						}
					});
			});
		});
};
