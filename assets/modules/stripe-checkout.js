import {
	Sargasso, utils
}
	from '@pelagiccreatures/sargasso'

class stripeClientCheckout extends Sargasso {
	constructor (element, options) {
		super(element, options)

		this.email = this.element.getAttribute('data-email')
		this.userID = this.element.getAttribute('data-user-id')
		this.plan = this.element.getAttribute('data-plan')
		this.customer = this.element.getAttribute('data-customer')
		this.button = this.element.querySelector('button')
		this.pk = this.element.getAttribute('data-stripe-pk')
	}

	start () {
		super.start()

		const stripe = Stripe(this.pk, {})

		this.on('click', '*', (e) => {
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
					const displayError = document.getElementById('error-message')
					displayError.textContent = result.error.message
				}
			})
		})
	}

	sleep () {
		this.off('click', '')
		super.sleep()
	}
}

utils.registerSargassoClass('stripeClientCheckout', stripeClientCheckout)

export {
	stripeClientCheckout
}
