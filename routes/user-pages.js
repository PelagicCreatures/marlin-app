const express = require('express');
const router = express.Router();
const async = require('async');
const VError = require('verror').VError;

const {
	validateToken,
	getUserForRequestMiddleware
} = require('../modules/antisocial-users/lib/get-user-for-request-middleware');

module.exports = function mount(userAPI) {
	router.get('/users/home', getUserForRequestMiddleware(userAPI), function (req, res, next) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}
		res.render('users/user-home', {
			user: req.antisocialUser,
			title: 'User Home',
			flash: req.query.flash
		});
	});

	router.get('/users/settings', getUserForRequestMiddleware(userAPI), function (req, res, next) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}
		res.render('users/user-settings', {
			user: req.antisocialUser
		});
	});

	router.get('/users/register', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (req.antisocialUser) {
			if (req.headers['x-digitopia-hijax']) {
				return res.set('x-digitopia-hijax-location', '/users/home').send('redirect to ' + '/users/home');
			}
			return res.redirect('/users/home');
		}
		res.render('users/user-reg', {});
	});

	router.get('/users/login', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (req.antisocialUser) {
			if (req.headers['x-digitopia-hijax']) {
				return res.set('x-digitopia-hijax-location', '/users/home').send('redirect to ' + '/users/home');
			}
			return res.redirect('/users/home');
		}
		res.render('users/user-login', {});
	});

	router.get('/users/change-email', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}
		res.render('users/user-change-email', {});
	});

	router.get('/users/change-password', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}
		res.render('users/user-change-password', {});
	});

	router.get('/users/password-reset', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (req.antisocialUser) {
			return res.sendStatus(401).send('Already logged in.');
		}
		res.render('users/user-password-reset', {});
	});

	router.get('/users/password-set', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (req.antisocialUser) {
			return res.sendStatus(401).send('Already logged in.');
		}
		if (!req.query.token) {
			return res.sendStatus(400);
		}

		async.series([
			function findToken(cb) {
				userAPI.db.getInstances('tokens', {
					'token': req.query.token
				}, function (err, tokenInstances) {
					if (err) {
						return cb(new VError(err, 'error reading token'));
					}
					if (!tokenInstances || tokenInstances.length !== 1) {
						return cb(new VError('Reset token was not found.'));
					}

					validateToken(userAPI.db, tokenInstances[0], function (err) {
						if (err) {
							return cb(err);
						}
						cb(null, tokenInstances[0]);
					});
				});
			}
		], function (err) {
			if (err) {
				return res.render('users/user-password-set', {
					error: err.message
				});
			}
			res.render('users/user-password-set', {
				token: req.query.token
			});
		});
	});

	return router;
};
