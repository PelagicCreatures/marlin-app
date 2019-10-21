const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const async = require('async');
const request = require('request');

const {
	check, validationResult
} = require('express-validator');

module.exports = (usersApp) => {

	debug('mounting users API /register');

	let createUser = require('../lib/create-user.js')(usersApp);
	let createToken = require('../lib/create-token.js')(usersApp);

	// create a new user
	usersApp.router.post('/register',

		check('email')
		.not().isEmpty()
		.isEmail(),

		check('name').optional()
		.trim(),

		check('username')
		.not().isEmpty()
		.trim()
		.withMessage('username is required'),

		check('password')
		.not().isEmpty()
		.custom(value => !/\s/.test(value)).withMessage('No spaces are allowed in the password')
		.isLength({
			min: 8
		})
		.withMessage('password must be at least 8 characters')
		.matches('[0-9]').withMessage('password must have at least one number')
		.matches('[a-z]').withMessage('password must have at least one lowercase character')
		.matches('[A-Z]').withMessage('password must have at least one uppercase character'),

		function (req, res) {

			debug('/register', req.body);

			var errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422)
					.json({
						status: 'error',
						flashLevel: 'danger',
						flashMessage: 'Registration failed, bad request.',
						errors: errors.array()
					});
			}

			async.waterfall([
				function captcha(cb) {
					if (!process.env.RECAPTCHA_SECRET) {
						return setImmediate(cb);
					}

					if (!req.body['g-recaptcha-response']) {
						return cb(new VError('missing required information'));
					}

					var ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;

					if (Object.prototype.toString.call(ip) === '[object Array]') {
						ip = ip[0];
					}
					else {
						ip = ip.split(', ')[0];
					}

					var recaptchaURL = 'https://www.google.com/recaptcha/api/siteverify?';
					recaptchaURL += 'secret=' + process.env.RECAPTCHA_SECRET + '&';
					recaptchaURL += 'response=' + req.body['g-recaptcha-response'] + '&';
					recaptchaURL += 'remoteip=' + ip;

					request(recaptchaURL, function (err, captchaRes, captchaBody) {
						if (err || captchaRes.statusCode != 200) {
							return cb(new VError(err, 'Captcha validation request failed'));
						}

						captchaBody = JSON.parse(captchaBody);
						if (!captchaBody.success) {
							return cb(new VError('Captcha validation failed'));
						}

						if (captchaBody.action !== 'login') {
							return cb(new VError('Captcha action mismatch'));
						}

						if (captchaBody.score < 0.5) {
							return cb(new VError('Captcha low score'));
						}

						cb();
					});
				},
				function (cb) {
					createUser(req.body, function (err, user) {
						cb(err, user);
					});
				},
				function (user, cb) {
					createToken(user, {}, function (err, token) {
						cb(err, user, token);
					});
				},
				function (user, loginToken, cb) {
					createToken(user, {
						ttl: usersApp.options.EMAIL_CONFIRM_TTL,
						type: 'validate'
					}, function (err, token) {
						usersApp.emit('sendEmailConfirmation', user, token);
						cb(err, user, loginToken);
					});
				}
			], function (err, user, token) {
				if (err) {
					return res.status(400).json({
						status: 'error',
						flashLevel: 'danger',
						flashMessage: 'Registration failed',
						errors: [{
							msg: err.message
						}]
					});
				}

				usersApp.emit('didRegister', user, req.body, function (err) {
					res.cookie('access-token', token.token, {
							'path': '/',
							'maxAge': token.ttl * 1000,
							'signed': true
						})
						.json({
							'status': 'ok',
							'flashLevel': 'success',
							'flashMessage': 'Saved. Please check your email for confirmation.',
							'didLogin': true,
							'result': {
								'id': user.id,
								'name': user.name,
								'username': user.username,
								'email': user.email
							}
						});
				});
			});
		});
};
