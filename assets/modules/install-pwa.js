import {
	Sargasso, utils
}
	from '@pelagiccreatures/sargasso'

import * as CMSUtils from '@pelagiccreatures/marlin/assets/modules/utils'

class InstallPWA extends Sargasso {
	constructor (element, options) {
		super(element, options)

		this.deferredPrompt = null
	}

	start () {
		super.start()
		this.handler = (e) => {
			this.setup(e)
		}
		window.addEventListener('beforeinstallprompt', this.handler)
	}

	setup (deferredPrompt) {
		this.addClass('shown')
		this.deferredPrompt = deferredPrompt

		this.clickHandler = (e) => {
			this.deferredPrompt.prompt()
			this.deferredPrompt.userChoice
				.then((choiceResult) => {
					if (choiceResult.outcome === 'accepted') {
						CMSUtils.flashAjaxStatus('info', 'App Installed')
						this.removeClass('shown')
					} else {
						CMSUtils.flashAjaxStatus('info', 'Cancelled')
					}
					this.deferredPrompt = null
				})
		}
		this.element.addEventListener('click', this.clickHandler)
	}

	sleep () {
		window.removeEventListener('beforeinstallprompt', this.handler)
		if (this.clickHandler) {
			this.element.removeEventListener('click', this.clickHandler)
		}
		super.sleep()
	}
}

utils.registerSargassoClass('InstallPWA', InstallPWA)

export {
	InstallPWA
}
