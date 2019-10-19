import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../modules/digitopia/js/controller.js';

function stripeClientCheckout(elem) {
	this.element = $(elem);
	var self = this;

	this.email = this.element.data('email');
	this.userID = this.element.data('user-id');
	this.plan = this.element.data('plan');
	this.customer = this.element.data('customer');
	this.button = this.element.find('button')[0];
	this.pk = this.element.data('stripe-pk');
	this.host = this.element.data('host');

	this.start = function () {
		var stripe = Stripe(this.pk, {});

		self.element.on('click', function () {
			// When the customer clicks on the button, redirect
			// them to Checkout.
			stripe.redirectToCheckout({
					items: [{
						plan: self.plan,
						quantity: 1
					}],
					customerEmail: self.email,
					clientReferenceId: self.userID,
					successUrl: window.location.protocol + '//' + self.host + '/users/subscription',
					cancelUrl: window.location.protocol + '//' + self.host + '/users/subscription',
				})
				.then(function (result) {
					if (result.error) {
						var displayError = document.getElementById('error-message');
						displayError.textContent = result.error.message;
					}
				});
		});
	}

	this.stop = function () {
		this.element.off('click');
	}
}
$.fn.stripeClientCheckout = GetJQueryPlugin('stripeClientCheckout', stripeClientCheckout);

export {
	stripeClientCheckout
}
