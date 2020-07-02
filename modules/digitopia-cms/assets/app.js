/*
	Import modules here as needed.

	Exports here are exposed on the global namespace as 'App' by webpack.

	EG.
		App.Utils

*/

import './modules/serializeObject'

import './modules/digitopia-stripe-checkout.js'

import './modules/digitopia-ajax-button.js'

import './modules/digitopia-pagination-controller.js'

import './modules/digitopia-admin-controller.js'

import './modules/digitopia-uploadable-image.js'

import './modules/digitopia-analytics-report.js'

import './modules/mola-mola-helpers.js'

import * as Utils from './modules/utils.js'

import {
	digitopiaAnalytics
}
	from './modules/digitopia-analytics.js'

if (publicOptions.USER_BEHAVIOR) {
	const anal = new digitopiaAnalytics(document.body, publicOptions.USER_BEHAVIOR)
	anal.start()
}

// expose these so huge markdown editor can be dynamically loaded
window.Sargasso = Utils.Sargasso
window.registerSargassoClass = Utils.utils.registerSargassoClass
window.elementTools = Utils.utils.elementTools

export {
	Utils
}
