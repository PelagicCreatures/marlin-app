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

	debug('mounting users API /password-change');

	let db = usersApp.db;

	const saltAndHash = require('../lib/salt-and-hash')(usersApp);
	const passwordMatch = require('../lib/password-match.js');

	usersApp.router.patch('/password-change', express.json(), getUserForRequestMiddleware(usersApp), csrfProtection,

		check('oldpassword')
		.not().isEmpty().withMessage('required')
		.custom(value => !/\s/.test(value)).withMessage('no spaces')
		.isLength({
			min: 8
		})
		.matches('[0-9]').withMessage('at least one number')
		.matches('[a-z]').withMessage('at least one lowercase character')
		.matches('[A-Z]').withMessage('at least one uppercase character'),

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

			debug('/password-change', req.body);

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
