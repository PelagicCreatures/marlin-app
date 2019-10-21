const debug = require('debug')('antisocial-user');

const {
	check, validationResult
} = require('express-validator');

module.exports = (usersApp) => {

	debug('mounting users API /password-reset');

	let db = usersApp.db;

	let createToken = require('../lib/create-token.js')(usersApp);

	usersApp.router.post('/password-reset', check('email').isEmail(), function (req, res) {
		db.getInstances('users', {
			'email': req.body.email
		}, function (err, token) {
			var errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422)
					.json({
						status: 'error',
						errors: errors.array()
					});
			}

			db.getInstances('users', {
				'email': req.body.email
			}, function (err, userInstances) {
				if (err) {
					return res.status(500).json({
						status: 'error',
						errors: [{
							msg: err.message
						}]
					});
				}

				if (!userInstances || userInstances.length !== 1) {
					return res.status(401)
						.json({
							'status': 'user not found'
						});
				}

				var user = userInstances[0];

				createToken(user, {
					ttl: usersApp.options.PASSWORD_RESET_TTL,
					type: 'reset'
				}, function (err, token) {
					usersApp.emit('sendPasswordReset', user, token);
					res.send({
						'status': 'ok',
						'flashLevel': 'success',
						'flashMessage': 'Message sent to ' + user.email + '. Please check your email.',
					});
				});
			});
		});
	});
};
