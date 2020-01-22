/*
	Import modules here as needed.

	Exports here are exposed on the global namespace as 'App' by webpack.

	EG.
		App.Utils

*/

import './modules/serializeObject'

import './modules/digitopia-form-controller.js'

import './modules/digitopia-form-validator.js'

import './modules/digitopia-stripe-checkout.js'

import './modules/digitopia-ajax-button.js'

import './modules/digitopia-flex-table.js'

import './modules/digitopia-pagination-controller.js'

import './modules/digitopia-admin-controller.js'

import './modules/digitopia-uploadable-image.js'

import './modules/digitopia-markdown-editor.js'

import './modules/digitopia-analytics-report.js'

import * as Utils from './modules/utils.js'

import {
	digitopiaAnalytics
}
	from './modules/digitopia-analytics.js'

if (publicOptions.USER_BEHAVIOR) {
	const anal = new digitopiaAnalytics(document.body, publicOptions.USER_BEHAVIOR)
}

export {
	Utils
}
