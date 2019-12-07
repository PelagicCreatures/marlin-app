const debug = require('debug')('antisocial-user');
const async = require('async');
const path = require('path');

const {
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

let viewsPath = path.join(__dirname, '../', 'views');

module.exports = (usersApp) => {

	debug('mounting users API /delete');

	let db = usersApp.db;

	usersApp.router.delete('/delete', getUserForRequestMiddleware(usersApp), function (req, res) {

		debug('/delete');

		var stripe = require('stripe')(process.env.STRIPE_SECRET);

		var currentUser = req.antisocialUser;
		if (!currentUser) {
			return res.status(401).json({
				status: 'error',
				errors: ['must be logged in']
			});
		}

		let actions = [];

		async.series([
			// cancel subscription if applicable
			(cb) => {
				if (!req.antisocialUser.stripeCustomer) {
					return setImmediate(cb);
				}
				stripe.customers.del(
					req.antisocialUser.stripeCustomer,
					function (err, confirmation) {
						if (err) {
							return cb(new VError(err, 'Error cancelling subscription'))
						}
						actions.push('Subscription Cancelled.');
						cb();
					});
			},
			// delete the user (will also delete all tokens)
			(cb) => {
				db.deleteInstance('User', req.antisocialUser.id, function (err) {
					if (err) {
						return cb(new VError(err, 'Error while deleting user'));
					}
					actions.push('User & Login Session Deleted.');
					cb();
				});
			}
		], function (err) {

			if (err) {
				return res.status(500).json({
					status: 'error',
					errors: [err.message]
				});
			}

			let count = 0;

			// delete all cookies
			for (let cookie in req.cookies) {
				++count;
				res.clearCookie(cookie, {
					path: '/'
				})
			}

			// delete all secure cookies
			for (let cookie in req.signedCookies) {
				++count;
				res.clearCookie(cookie, {
					path: '/',
					signed: true,
					httpOnly: true
				})
			}

			actions.push(count + ' Browser Cookies Deleted.');

			res.send({
				status: 'ok',
				flashLevel: 'info',
				flashMessage: actions.join(', '),
				didLogout: true
			});

		})
	});
};
