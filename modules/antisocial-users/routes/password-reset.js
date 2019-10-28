const debug = require('debug')('antisocial-user');
const csrf = require('csurf');
const express = require('express');

const csrfProtection = csrf({
	cookie: {
		signed: true,
		httpOnly: true
	},
	ignoreMethods: process.env.testing ? ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'] : []
});
const {
	check, validationResult
} = require('express-validator');

module.exports = (usersApp) => {

	debug('mounting users API /password-reset');

	let db = usersApp.db;

	let createToken = require('../lib/create-token.js')(usersApp);

	usersApp.router.patch('/password-reset', express.json(), csrfProtection, check('email').isEmail(), function (req, res) {

		debug('/password-reset', req.body);

		var errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422)
				.json({
					status: 'error',
					flashLevel: 'danger',
					flashMessage: 'failed, bad request.',
					errors: errors.array()
				});
		}

		db.getInstances('User', {
			where: {
				'email': req.body.email
			}
		}, function (err, token) {

			db.getInstances('User', {
				where: {
					'email': req.body.email
				}
			}, function (err, userInstances) {
				if (err) {
					return res.status(500).json({
						status: 'error',
						errors: [err.message]
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
