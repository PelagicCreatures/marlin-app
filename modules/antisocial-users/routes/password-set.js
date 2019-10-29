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
	ignoreMethods: process.env.TESTING ? ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'] : []
});
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

	usersApp.router.patch('/password-set', express.json(), csrfProtection,

		check('token').isLength({
			min: 64
		}),

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

			debug('/passord-set', req.body);

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
						errors: ['token is required']
					});
			}

			async.waterfall([
				function findToken(cb) {
					db.getInstances('Token', {
						where: {
							'token': req.body.token,
							'type': 'reset'
						}
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
				function savePassword(token, user, cb) {
					db.updateInstance('User', user.id, {
						'password': saltAndHash(req.body.password)
					}, function (err, updated) {
						if (err) {
							return db(new VError('unable to save password'));
						}
						cb(null, token, updated);
					});
				},
				function deleteToken(token, user, cb) {
					db.deleteInstance('Token', token.id, function (err) {
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
						errors: [err.message]
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
