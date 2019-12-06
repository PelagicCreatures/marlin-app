const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const async = require('async');
const express = require('express');


var stripe = require('stripe')(process.env.STRIPE_SECRET);

module.exports = (usersApp) => {

	debug('mounting users API /stripe-webhook');

	usersApp.router.post('/stripe-webhook', express.json(), function (req, res) {
		var hook;
		try {
			hook = req.body.event ? JSON.parse(req.body.event) : req.body;
		}
		catch (e) {
			return res.sendStatus(401);
		}

		//console.log('webhook: %j', hook.id);

		var theEvent;

		if (!hook || !hook.id) {
			return res.sendStatus(401);
		}

		stripe.events.retrieve(hook.id, function (err, event) {
			if (err) {
				return res.status(401).send(err);
			}

			if (!event) {
				return res.sendStatus(401);
			}

			theEvent = event;

			var doIt = false;
			var userId;
			var customerId;
			var patch;

			switch (event.type) {
			case 'checkout.session.completed':
				doIt = true;
				userId = event.data.object.client_reference_id;
				patch = {
					stripeCustomer: event.data.object.customer,
					stripeSubscription: event.data.object.subscription,
					stripeStatus: 'ok'
				};
				break;
			case 'invoice.payment_failed':
				customerId = event.data.object.customer;
				patch = {
					stripeStatus: 'subscription suspended: charge denied'
				};
				doIt = true;
				break;
			case 'invoice.payment_succeeded':
				customerId = event.data.object.customer;
				patch = {
					stripeStatus: 'ok'
				};
				doIt = true;
				break;
			case 'customer.deleted':
				doIt = true;
				customerId = event.data.object.id;
				patch = {
					stripeCustomer: '',
					stripeSubscription: '',
					stripeStatus: 'customer deleted'
				};
				break;
			case 'customer.subscription.deleted':
				doIt = true;
				customerId = event.data.object.customer;
				patch = {
					stripeSubscription: '',
					stripeStatus: 'subscription cancelled'
				};
				break;

			}

			if (!doIt) {
				return res.sendStatus(200);
			}

			if (!userId && !customerId) {
				console.log('webhook error: no user identifier %j', event);
				return res.sendStatus(200);
			}

			async.waterfall([
				function readUser(cb) {
					var query;

					if (userId) {
						query = {
							'id': userId
						};
					}

					if (customerId) {
						query = {
							'stripeCustomer': customerId
						};
					}

					usersApp.db.getInstances('User', {
						where: query
					}, function (err, userInstances) {
						if (err) {
							return cb(err);
						}
						if (!userInstances || userInstances.length !== 1) {
							var e = new Error('webhook user not found %s', userId);
							e.reason_code = 'user-not-found';
							return cb(e);
						}

						cb(null, userInstances[0]);

					});
				},
				function deleteOldCustomer(user, cb) {
					if (userId && patch.stripeCustomer && user.stripeCustomer && user.stripeCustomer !== patch.stripeCustomer) {
						stripe.customers.del(user.stripeCustomer, function (err, confirmation) {
							cb(err, user);
						});
					}
					else {
						cb(null, user);
					}
				},
				function patchUser(user, cb) {
					usersApp.db.updateInstance('User', user.id, patch, function (err) {
						if (err) {
							cb(new VError(err, 'webhook patchUser failed'));
						}
						cb(null);
					});
				}
			], function (err) {
				if (err) {
					console.log('webhook error: %s %j', err.message, event);
				}
				else {
					res.sendStatus(200);
				}
			});
		});
	});
};
