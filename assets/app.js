/*
	Import modules here as needed.

	Exports here are exposed on the global namespace as 'App' by webpack.

	EG.
		App.MDC.MDCRipple

*/

import * as MDC from './modules/MDC'
import jQuery from "jquery";
import Cookies from "js-cookie";
import async from "async";

import {
	GetJQueryPlugin, digitopiaController
}
from '../modules/digitopia/js/controller.js';

import formController from './modules/digitopia-form-controller.js'
import formValidator from './modules/digitopia-form-validator.js'
import stripeClientCheckout from './modules/digitopia-stripe-checkout.js'
import ajaxButton from './modules/digitopia-ajax-button.js'
import flexTable from './modules/digitopia-flex-table.js'
import paginationController from './modules/digitopia-pagination-controller.js'
import adminController from './modules/digitopia-admin-controller.js'

export {
	MDC,
	jQuery,
	Cookies,
	async,
	digitopiaController
}
