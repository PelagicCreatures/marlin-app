/*
	Import modules here as needed.

	Exports here are exposed on the global namespace as 'App' by webpack.

	EG.
		App.MDC.MDCRipple

*/

import {
	test
}
from './modules/testES6'

import * as MDC from './modules/MDC'

import jQuery from "jquery";
import Cookies from "js-cookie"


export {
	MDC,
	test,
	jQuery,
	Cookies
}
