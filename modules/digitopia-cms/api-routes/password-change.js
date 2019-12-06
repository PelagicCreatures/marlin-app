const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const async = require('async');
const csrf = require('csurf');
const express = require('express');
const {
	validatePayload
} = require('../lib/validator-extensions');

const csrfProtection = csrf({
	cookie: {
		signed: true,
		httpOnly: true
	},
	ignoreMethods: process.env.TESTING ? ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'] : []
});

const {
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

module.exports = (usersApp) => {

	debug('mounting users API /password-change');

	let db = usersApp.db;

	const saltAndHash = require('../lib/salt-and-hash')(usersApp);
	const passwordMatch = require('../lib/password-match.js');

	usersApp.router.patch('/password-change', express.json(), getUserForRequestMiddleware(usersApp), csrfProtection, function (req, res) {

		debug('/password-change');

		let errors = validatePayload(req.body, {
			oldpassword: {
				isPassword: true
			},
			password: {
				isPassword: true
			}
		}, {
			strict: true,
			additionalProperties: ['_csrf']
		});

		if (errors.length) {
			return res
				.status(422)
				.json({
					status: 'error',
					errors: errors
				});
		}

		var currentUser = req.antisocialUser;
		if (!currentUser) {
			return res.status(401).json({
				status: 'error',
				errors: ['must be logged in']
			});
		}

		async.waterfall([
			function (cb) {
				passwordMatch(req.body.oldpassword, currentUser, function (err, isMatch) {
					if (err) {
						return cb(err);
					}

					if (!isMatch) {
						return cb(new VError('password mismatch'));
					}

					cb(null);
				});
			},
			function (donePatch) {
				db.updateInstance('User', currentUser.id, {
					'password': saltAndHash(req.body.password)
				}, function (err, user) {
					if (err) {
						return db(new VError('unable to save pendingEmail'));
					}
					donePatch(null);
				});
			}
		], function (err) {
			if (err) {
				return res.status(400).json({
					status: 'error',
					flashLevel: 'danger',
					flashMessage: 'Change Password failed',
					errors: [err.message]
				});
			}

			res.json({
				'status': 'ok',
				'flashLevel': 'success',
				'flashMessage': 'Password Changed.'
			});
		});
	});
};
