import {
	Sargasso, registerSargassoClass
}
	from '@pelagiccreatures/sargasso'

import * as Utils from './utils'

class NewPageHandler extends Sargasso {
	constructor (elem, options) {
		super(elem, options)
	}

	newPage () {
		const containers = document.querySelectorAll('[data-hijax]')
		for (let i = 0; i < containers.length; i++) {
			Utils.instantiateMaterialDesignElements(containers[i])
		}
		Utils.checkSubscription()
	}
}

registerSargassoClass('NewPageHandler', NewPageHandler)

export {
	NewPageHandler
}
