const express = require('express');
const router = express.Router();

const getUserForRequestMiddleware = require('../modules/antisocial-users/lib/get-user-for-request-middleware').getUserForRequestMiddleware;

module.exports = function mount(userAPI) {

	router.get('/users/register', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (req.antisocialUser) {
			return res.redirect('/users/home');
		}
		res.render('user-reg', {});
	});

	router.get('/users/login', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (req.antisocialUser) {
			return res.redirect('/users/home');
		}
		res.render('user-login', {});
	});

	router.get('/users/password-reset', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (req.antisocialUser) {
			return res.redirect('/users/home');
		}
		res.render('user-password-reset', {});
	});

	router.get('/users/change-email', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (!req.antisocialUser) {
			return res.redirect('/users/home');
		}
		res.render('user-change-email', {});
	});

	router.get('/users/password-set', getUserForRequestMiddleware(userAPI), function (req, res) {
		if (!req.antisocialUser) {
			return res.redirect('/users/home');
		}
		res.render('user-password-set', {});
	});

	return router;
};
