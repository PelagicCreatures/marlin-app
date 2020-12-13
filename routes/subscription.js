const VError = require('verror').VError
const debug = require('debug')('marlin-user')
const async = require('async')
const express = require('express')
const router = express.Router()

const {
	getUserForRequestMiddleware
} = require('@pelagiccreatures/marlin/lib/get-user-for-request-middleware')

module.exports = (app) => {
	const marlin = app.marlin
	debug('mounting users API /subscription-cancel')

	const stripe = require('stripe')(process.env.STRIPE_SECRET)

	router.get('/users/subscription', getUserForRequestMiddleware(app.marlin), function (req, res) {
		if (!req.antisocialUser) {
			return res.redirect('/users/login')
		}

		const stripe = require('stripe')(process.env.STRIPE_SECRET)

		if (req.antisocialUser.stripeCustomer) {
			async.waterfall([
				function (cb) {
					stripe.customers.retrieve(req.antisocialUser.stripeCustomer, function (err, customer) {
						cb(err, customer)
					})
				},
				function (customer, cb) {
					if (!customer.subscriptions || !customer.subscriptions.data.length) {
						return setImmediate(function () {
							cb(null, customer, null)
						})
					}

					stripe.paymentMethods.retrieve(customer.subscriptions.data[0].default_payment_method, function (err, paymentMethod) {
						cb(err, customer, paymentMethod)
					})
				},
				function (customer, paymentMethod, cb) {
					stripe.invoices.retrieveUpcoming({
						customer: req.antisocialUser.stripeCustomer
					}, function (err, upcoming) {
						cb(null, customer, paymentMethod, upcoming)
					})
				},
				function (customer, paymentMethod, upcoming, cb) {
					stripe.invoices.list({
						customer: req.antisocialUser.stripeCustomer,
						limit: 3
					}, function (err, invoices) {
						cb(err, customer, paymentMethod, upcoming, invoices)
					})
				}
			],
			function (err, customer, paymentMethod, upcoming, invoices) {
				if (err) {
					return res.status(500)
				}
				res.render('subscription', {
					user: req.antisocialUser,
					stripe: customer,
					paymentMethod: paymentMethod,
					upcoming: upcoming,
					invoices: invoices
				})
			})
		} else {
			res.render('subscription', {
				user: req.antisocialUser
			})
		}
	})

	router.delete('/users/subscription-cancel', getUserForRequestMiddleware(marlin), function (req, res) {
		console.log('/users/subscription-cancel')

		const currentUser = req.antisocialUser
		if (!currentUser) {
			return res.status(401).json({
				status: 'error',
				flashLevel: 'danger',
				flashMessage: 'Subscription cancel failed',
				errors: ['Must be logged in']
			})
		}

		if (req.antisocialUser.stripeCustomer && req.antisocialUser.stripeSubscription) {
			stripe.subscriptions.update(
				req.antisocialUser.stripeSubscription, {
					cancel_at_period_end: true
				},
				function (err, confirmation) {
					if (err) {
						return res.status(500).send({
							status: 'error',
							flashLevel: 'danger',
							flashMessage: 'Subscription cancel failed',
							errors: [
								err.message
							]
						})
					}
					res.send({
						status: 'ok',
						flashLevel: 'info',
						flashMessage: 'Subscription cancelled.'
					})
				}
			)
		} else {
			return res.sendStatus(401)
		}
	})

	return router
}
