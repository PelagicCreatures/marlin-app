import $ from 'jquery'

import {
	Reagent, registerReagentClass
}
	from '../../../reagent/lib/Reagent'

class stripeClientCheckout extends Reagent {
	constructor (element, options) {
		super(element, options)
		this.jqElement = $(element)

		this.email = this.jqElement.data('email')
		this.userID = this.jqElement.data('user-id')
		this.plan = this.jqElement.data('plan')
		this.customer = this.jqElement.data('customer')
		this.button = this.jqElement.find('button')[0]
		this.pk = this.jqElement.data('stripe-pk')
	}

	start () {
		super.start()

		var stripe = Stripe(this.pk, {})

		this.jqElement.on('click', () => {
			// When the customer clicks on the button, redirect
			// them to Checkout.
			stripe.redirectToCheckout({
				items: [{
					plan: this.plan,
					quantity: 1
				}],
				customerEmail: this.email,
				clientReferenceId: this.userID.toString(),
				successUrl: publicOptions.PUBLIC_HOST + '/users/subscription',
				cancelUrl: publicOptions.PUBLIC_HOST + '/users/subscription'
			}).then(function (result) {
				if (result.error) {
					var displayError = document.getElementById('error-message')
					displayError.textContent = result.error.message
				}
			})
		})
	}

	sleep () {
		this.jqElement.off('click')
		super.sleep()
	}
}

registerReagentClass('stripeClientCheckout', stripeClientCheckout)

export {
	stripeClientCheckout
}
