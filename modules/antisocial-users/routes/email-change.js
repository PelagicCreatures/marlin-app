const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const async = require('async');
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

const {
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

module.exports = (usersApp) => {

	debug('mounting users API /email-change');

	let db = usersApp.db;

	let createToken = require('../lib/create-token.js')(usersApp);

	usersApp.router.patch('/email-change', express.json(), getUserForRequestMiddleware(usersApp), csrfProtection, check('email').isEmail(), function (req, res) {

		debug('/email-change', req.body);

		var currentUser = req.antisocialUser;
		if (!currentUser) {
			return res.status(401).json({
				status: 'error',
				errors: ['must be logged in']
			});
		}

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

		// patch user.pendingEmail, generate token, send validation email
		async.waterfall([
			function (donePatch) {
				db.updateInstance('User', currentUser.id, {
					'pendingEmail': req.body.email,
					'validated': false
				}, function (err, user) {
					if (err) {
						return db(new VError('unable to save pendingEmail'));
					}
					donePatch(null, user);
				});
			},
			function (user, doneToken) {
				createToken(user, {
					ttl: usersApp.options.EMAIL_CONFIRM_TTL,
					type: 'validate'
				}, function (err, token) {
					usersApp.emit('sendEmailConfirmation', user, token);
					doneToken(err);
				});
			}
		], function (err) {

			if (err) {
				return res.status(400).json({
					status: 'error',
					flashLevel: 'danger',
					flashMessage: 'Change Email failed',
					errors: [err.message]
				});
			}

			res.json({
				'status': 'ok',
				'flashLevel': 'success',
				'flashMessage': 'Saved. Please check your email for confirmation.',
				'hijaxLocation': '/users/home'
			});
		});
	});
};
