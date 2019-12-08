/*
	Import modules here as needed.

	Exports here are exposed on the global namespace as 'App' by webpack.

	EG.
		App.MDC.MDCRipple

*/

import * as MDC from './modules/MDC'

import {
	serializeObject
}
from "./modules/serializeObject";

import {
	GetJQueryPlugin, digitopiaController
}
from '../../digitopia/js/controller.js';

import {
	formController
}
from './modules/digitopia-form-controller.js'

import {
	formValidator
}
from './modules/digitopia-form-validator.js'

import {
	stripeClientCheckout
}
from './modules/digitopia-stripe-checkout.js'

import {
	ajaxButton
}
from './modules/digitopia-ajax-button.js'

import {
	flexTable
}
from './modules/digitopia-flex-table.js'

import {
	paginationController
}
from './modules/digitopia-pagination-controller.js'

import {
	adminController
}
from './modules/digitopia-admin-controller.js'

import {
	uploadableImage
}
from './modules/digitopia-uploadable-image.js'

import {
	markdownEditor
}
from './modules/digitopia-markdown-editor.js'

import {
	digitopiaAnalytics
}
from './modules/digitopia-analytics.js'

import {
	digitopiaAnalyticsReport
}
from './modules/digitopia-analytics-report.js'

import * as Utils from './modules/utils.js'

export {
	Utils,
	MDC,
	digitopiaController,
	digitopiaAnalytics
}
