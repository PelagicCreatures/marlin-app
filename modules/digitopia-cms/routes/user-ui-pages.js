const express = require('express');
const router = express.Router();
const async = require('async');
const VError = require('verror').VError;
const csrf = require('csurf');
const {
	handlePut, getAdmin
} = require('../lib/admin');
const path = require('path');

const csrfProtection = csrf({
	cookie: {
		signed: true,
		httpOnly: true
	}
});

const {
	validateToken,
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

module.exports = function mount(app) {

	let viewsPath = path.join(__dirname, '../', 'views');

	router.get('/users/home', getUserForRequestMiddleware(app), function (req, res, next) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}
		res.render(viewsPath + '/home', {
			user: req.antisocialUser,
			flash: req.query.flash,
		});
	});

	router.get('/users/photo', getUserForRequestMiddleware(app), function (req, res, next) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}

		let admin = getAdmin('User').getColumn('profilePhoto');

		res.render(viewsPath + '/photo', {
			user: req.antisocialUser,
			uploadFormElement: admin.getForm(req.antisocialUser)
		});
	});

	router.patch('/users/profile-photo', getUserForRequestMiddleware(app), express.json({
		limit: '20mb'
	}), function (req, res, next) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}
		handlePut(app, 'User', req.antisocialUser.id, req.body['User'], ['profilePhoto'], req, res, next);
	})

	router.get('/users/settings', getUserForRequestMiddleware(app), function (req, res, next) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}
		res.render(viewsPath + '/settings', {
			user: req.antisocialUser
		});
	});

	router.get('/users/register', getUserForRequestMiddleware(app), csrfProtection, function (req, res) {
		if (req.antisocialUser) {
			if (req.headers['x-digitopia-hijax']) {
				return res.set('Sargasso-Location', '/users/home').send('redirect to ' + '/users/home');
			}
			return res.redirect('/users/home');
		}
		res.render(viewsPath + '/register', {
			csrfToken: req.csrfToken(),
			validators: getAdmin('User').getValidations()
		});
	});

	router.get('/users/validate', getUserForRequestMiddleware(app), csrfProtection, function (req, res) {
		if (req.antisocialUser && req.antisocialUser.validated) {
			if (req.headers['x-digitopia-hijax']) {
				return res.set('Sargasso-Location', '/users/home').send('redirect to ' + '/users/home');
			}
			return res.redirect('/users/home');
		}

		res.render(viewsPath + '/email-validate', {
			user: req.antisocialUser,
			token: req.query.token,
			flash: !req.query.token ? 'Error: Missing email validation token' : '',
			csrfToken: req.csrfToken()
		});
	});

	router.get('/users/login', getUserForRequestMiddleware(app), csrfProtection, function (req, res) {
		if (req.antisocialUser) {
			if (req.headers['x-digitopia-hijax']) {
				return res.set('Sargasso-Location', '/users/home').send('redirect to ' + '/users/home');
			}
			return res.redirect('/users/home');
		}
		res.render(viewsPath + '/login', {
			csrfToken: req.csrfToken(),
			validators: getAdmin('User').getValidations()
		});
	});

	router.get('/users/email-change', getUserForRequestMiddleware(app), csrfProtection, function (req, res) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}
		res.render(viewsPath + '/email-change', {
			user: req.antisocialUser,
			csrfToken: req.csrfToken(),
			validators: getAdmin('User').getValidations()
		});
	});

	router.get('/users/password-change', getUserForRequestMiddleware(app), csrfProtection, function (req, res) {
		if (!req.antisocialUser) {
			return res.sendStatus(401);
		}
		res.render(viewsPath + '/password-change', {
			user: req.antisocialUser,
			csrfToken: req.csrfToken(),
			validators: getAdmin('User').getValidations()
		});
	});

	router.get('/users/password-reset', getUserForRequestMiddleware(app), csrfProtection, function (req, res) {
		if (req.antisocialUser) {
			return res.sendStatus(401).send('Already logged in.');
		}
		res.render(viewsPath + '/password-reset', {
			csrfToken: req.csrfToken(),
			validators: getAdmin('User').getValidations()
		});
	});

	router.get('/users/password-set', getUserForRequestMiddleware(app), csrfProtection, function (req, res) {
		if (req.antisocialUser) {
			return res.sendStatus(401).send('Already logged in.');
		}
		if (!req.query.token) {
			return res.sendStatus(400);
		}

		async.series([
			function findToken(cb) {
				app.db.getInstances('Token', {
					where: {
						'token': req.query.token
					}
				}, function (err, tokenInstances) {
					if (err) {
						return cb(new VError(err, 'error reading token'));
					}
					if (!tokenInstances || tokenInstances.length !== 1) {
						return cb(new VError('Reset token was not found.'));
					}

					validateToken(app.db, tokenInstances[0], function (err) {
						if (err) {
							return cb(err);
						}
						cb(null, tokenInstances[0]);
					});
				});
			}
		], function (err) {
			if (err) {
				return res.render(viewsPath + '/user-password-set', {
					error: err.message
				});
			}
			res.render(viewsPath + '/password-set', {
				token: req.query.token,
				csrfToken: req.csrfToken(),
				validators: getAdmin('User').getValidations()
			});
		});
	});

	router.get('/users/tokens', getUserForRequestMiddleware(app), function (req, res) {
		if (!req.antisocialUser) {
			return res.redirect('/users/login');
		}

		req.antisocialUser.getTokens({
			where: {
				type: 'access'
			}
		}).then((tokens) => {
			res.render(viewsPath + '/tokens', {
				user: req.antisocialUser,
				tokens: tokens,
				currentToken: req.antisocialToken.token
			});
		}).catch(err => {
			res.status(500);
		});
	});

	router.get('/users/subscription', getUserForRequestMiddleware(app), function (req, res) {
		if (!req.antisocialUser) {
			return res.redirect('/users/login');
		}

		var stripe = require("stripe")(process.env.STRIPE_SECRET);

		if (req.antisocialUser.stripeCustomer) {
			async.waterfall([
					function (cb) {
						stripe.customers.retrieve(req.antisocialUser.stripeCustomer, function (err, customer) {
							cb(err, customer);
						});
					},
					function (customer, cb) {
						if (!customer.subscriptions || !customer.subscriptions.data.length) {
							return setImmediate(function () {
								cb(null, customer, null);
							});
						}

						stripe.paymentMethods.retrieve(customer.subscriptions.data[0].default_payment_method, function (err, paymentMethod) {
							cb(err, customer, paymentMethod);
						});
					},
					function (customer, paymentMethod, cb) {
						stripe.invoices.retrieveUpcoming({
							customer: req.antisocialUser.stripeCustomer
						}, function (err, upcoming) {
							cb(null, customer, paymentMethod, upcoming);
						});
					},
					function (customer, paymentMethod, upcoming, cb) {
						stripe.invoices.list({
							customer: req.antisocialUser.stripeCustomer,
							limit: 3
						}, function (err, invoices) {
							cb(err, customer, paymentMethod, upcoming, invoices);
						});
					}
				],
				function (err, customer, paymentMethod, upcoming, invoices) {
					if (err) {
						return res.status(500);
					}
					res.render(viewsPath + '/subscription', {
						user: req.antisocialUser,
						stripe: customer,
						paymentMethod: paymentMethod,
						upcoming: upcoming,
						invoices: invoices
					});
				});
		}
		else {
			res.render(viewsPath + '/subscription', {
				user: req.antisocialUser
			});
		}
	})

	return router;
};
