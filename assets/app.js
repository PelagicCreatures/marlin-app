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

export {
	MDC,
	jQuery,
	Cookies,
	async
}
