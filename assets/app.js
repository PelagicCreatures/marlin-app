// import any ES6 modules you need here and they will get bundled in

import './js/_globals'

import './modules/install-pwa'

import './modules/notifications-subscribe'

import './modules/stripe-checkout.js'

import {
	utils
}
	from '@pelagiccreatures/sargasso'

import './modules/analytics-report.js'

import {
	Analytics
}
	from './modules/analytics.js'

import {
	CMSUtils
}
	from '@pelagiccreatures/marlin/assets/app'

if (publicOptions.USER_BEHAVIOR) {
	const anal = new Analytics(document.body, publicOptions.USER_BEHAVIOR)
	anal.start()
}

const boot = () => {
	utils.bootSargasso({
		scrollElement: document.getElementById('overscroll-wrapper') || window,
		breakpoints: {},
		hijax: {
			onError: (level, message) => {
				CMSUtils.flashAjaxStatus(level, message)
			},
			onLoading: function () {
				CMSUtils.tropicBird.progressBar(this.readyState !== 4)
			},
			onExitPage: () => {},
			onEnterPage: () => {
				CMSUtils.checkSubscription()
			}
		}
	})
}

export {
	CMSUtils,
	boot
}
