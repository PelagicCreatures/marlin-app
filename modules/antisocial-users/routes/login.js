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
		check('email')
		.not().isEmpty()
		.isEmail(),

		check('password')
		.not().isEmpty().withMessage('required')
		.custom(value => !/\s/.test(value)).withMessage('no spaces')
		.isLength({
			min: 8
		})
		.matches('[0-9]').withMessage('at least one number')
		.matches('[a-z]').withMessage('at least one lowercase character')
		.matches('[A-Z]').withMessage('at least one uppercase character'),

		function (req, res) {

			debug('/login', req.body);

			var errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422)
					.json({
						status: 'error',
						errors: errors.array()
					});
			}

			var ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;

			if (Object.prototype.toString.call(ip) === '[object Array]') {
				ip = ip[0];
			}
			else {
				ip = ip.split(', ')[0];
			}

			async.waterfall([
				function (cb) {
					db.getInstances('users', {
						where: {
							'email': req.body.email
						}
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
					createToken(user, {
						ip: ip
					}, function (err, token) {
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

				// if we use subscriptions manage the 'subscriber' cookie
				if (process.env.STRIPE_SECRET) {
					if (user.stripeStatus === 'ok') {
						res.cookie('subscriber', 1, {
							'path': '/'
						});
					}
					else {
						if (req.cookies.subscriber) {
							res.clearCookie('subscriber', {
								'path': '/'
							});
						}
					}
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
						'didLogin': true,
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
