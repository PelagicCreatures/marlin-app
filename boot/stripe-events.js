const VError = require('verror').VError

// cancel subscription if applicable

module.exports = (app) => {
	if (process.env.STRIPE_SECRET) {
		const stripe = require('stripe')(process.env.STRIPE_SECRET)

		app.marlin.on('deleteUser', (instance, cb) => {
			if (!instance.stripeCustomer) {
				return cb()
			}
			stripe.customers.del(
				instance.stripeCustomer,
				function (err, confirmation) {
					if (err) {
						return cb(new VError(err, 'Error cancelling subscription'))
					}
					cb(null, 'subscription cancelled')
				})
		})
	}
}
