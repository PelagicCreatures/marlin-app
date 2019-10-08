const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const async = require('async');

const {
	check, validationResult
} = require('express-validator');

const {
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

module.exports = (usersApp) => {

	debug('mounting users API /change-password');

	let db = usersApp.db;

	const saltAndHash = require('../lib/salt-and-hash')(usersApp);
	const passwordMatch = require('../lib/password-match.js');

	usersApp.router.post('/change-password',
		getUserForRequestMiddleware(usersApp),

		check('oldpassword')
		.custom(value => !/\s/.test(value)).withMessage('No spaces are allowed in the password')
		.isLength({
			min: 8
		}).withMessage('password must be at least 8 characters')
		.matches('[0-9]').withMessage('password must have at least one number')
		.matches('[a-z]').withMessage('password must have at least one lowercase character')
		.matches('[A-Z]').withMessage('password must have at least one uppercase character'),

		check('password')
		.custom(value => !/\s/.test(value)).withMessage('No spaces are allowed in the password')
		.isLength({
			min: 8
		}).withMessage('password must be at least 8 characters')
		.matches('[0-9]').withMessage('password must have at least one number')
		.matches('[a-z]').withMessage('password must have at least one lowercase character')
		.matches('[A-Z]').withMessage('password must have at least one uppercase character'),

		function (req, res) {

			debug('/change-password', req.body);

			var currentUser = req.antisocialUser;
			if (!currentUser) {
				return res.status(401).json({
					status: 'error',
					errors: [{
						msg: 'must be logged in'
					}]
				});
			}

			var errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422)
					.json({
						status: 'error',
						flashLevel: 'danger',
						flashMessage: 'Password change failed, bad request.',
						errors: errors.array()
					});
			}

			async.waterfall([
				function (user, cb) {
					passwordMatch(req.body.oldpassword, currentUser, function (err, isMatch) {
						if (err) {
							return cb(err);
						}

						if (!isMatch) {
							return cb(new VError('password mismatch'));
						}

						cb(null, user);
					});
				},
				function (donePatch) {
					db.updateInstance('users', currentUser.id, {
						'password': saltAndHash(req.body.password)
					}, function (err, user) {
						if (err) {
							return db(new VError('unable to save pendingEmail'));
						}
						donePatch(null, user);
					});
				}
			], function (err) {
				if (err) {
					return res.status(400).json({
						status: 'error',
						flashLevel: 'danger',
						flashMessage: 'Change Password failed',
						errors: [{
							msg: err.message
						}]
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
