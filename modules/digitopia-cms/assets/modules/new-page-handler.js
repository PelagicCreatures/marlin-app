import {
	Reagent, registerReagentClass
}
	from '@antisocialnet/reagent'

import * as Utils from './utils'

class NewPageHandler extends Reagent {
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

registerReagentClass('NewPageHandler', NewPageHandler)

export {
	NewPageHandler
}
