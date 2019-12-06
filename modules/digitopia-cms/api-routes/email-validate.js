const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const async = require('async');
const csrf = require('csurf');
const express = require('express');
const getAdmin = require('../lib/admin').getAdmin;

const csrfProtection = csrf({
	cookie: {
		signed: true,
		httpOnly: true
	},
	ignoreMethods: process.env.TESTING ? ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'] : []
});

const {
	validateToken, getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

const {
	validatePayload
} = require('../lib/validator-extensions');

module.exports = (usersApp) => {

	debug('mounting users API /email-validate');

	let db = usersApp.db;

	usersApp.router.patch('/email-validate', express.json(), getUserForRequestMiddleware(usersApp), csrfProtection, function (req, res) {

		debug('/email-validate', req.body);

		let validators = getAdmin('Token').getValidations();

		let errors = validatePayload(req.body, {
			token: validators.token
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

		// user is already logged in and validated
		if (req.antisocialUser && req.antisocialUser.validated) {
			return res.json({
				status: 'error',
				errors: ['Your account has already been activated.']
			});
		}

		async.waterfall([
			function findToken(cb) {
				debug('finding validation token');
				db.getInstances('Token', {
					where: {
						'token': req.body.token,
						'type': 'validate'
					}
				}, function (err, tokenInstances) {
					if (err) {
						return cb(new VError(err, 'error reading token'));
					}

					if (!tokenInstances || tokenInstances.length !== 1) {
						return cb(new VError('Validation code was not found or has expired.'));
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
				debug('reading user for token');
				db.getInstances('User', {
					where: {
						'id': token.userId
					}
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
				debug('saving user validated');
				db.updateInstance('User', user.id, {
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
				debug('deleting token');
				db.deleteInstance('Token', token.id, function (err) {
					if (err) {
						return cb(new VError(err, 'could not delete token'));
					}
					return cb(null, user);
				});
			}
		], function (err, user) {
			if (err) {
				return res.json({
					status: 'error',
					flashLevel: 'error',
					flashMessage: 'Email validation failed',
					errors: [err.message]
				});
			}

			return res.json({
				status: 'ok',
				flashLevel: 'info',
				flashMessage: 'Email validated'
			});
		});
	});
};
