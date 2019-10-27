const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const {
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

module.exports = (usersApp) => {

	debug('mounting users API /subscription-cancel');

	var stripe = require('stripe')(process.env.STRIPE_SECRET);

	usersApp.router.delete('/subscription-cancel', getUserForRequestMiddleware(usersApp), function (req, res) {

		console.log('/subscription-cancel');

		var currentUser = req.antisocialUser;
		if (!currentUser) {
			return res.status(401).json({
				status: 'error',
				flashLevel: 'danger',
				flashMessage: 'Subscription cancel failed',
				errors: ['Must be logged in']
			});
		}

		if (req.antisocialUser.stripeCustomer && req.antisocialUser.stripeSubscription) {
			stripe.subscriptions.update(
				req.antisocialUser.stripeSubscription, {
					cancel_at_period_end: true
				},
				function (err, confirmation) {
					if (err) {
						return res.status(500).send({
							'status': 'error',
							'flashLevel': 'danger',
							'flashMessage': 'Subscription cancel failed',
							'errors': [
								err.message
							]
						});
					}
					res.send({
						'status': 'ok',
						'flashLevel': 'info',
						'flashMessage': 'Subscription cancelled.'
					});
				}
			);
		}
		else {
			return res.sendStatus(401);
		}
	});
};
