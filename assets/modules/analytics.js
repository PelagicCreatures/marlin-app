import {
	Sargasso, utils
}
	from '@pelagiccreatures/sargasso'

import Cookies from 'js-cookie'

import {
	CMSUtils
}
	from '@pelagiccreatures/marlin/assets/app'

class Analytics extends Sargasso {
	constructor (elem, options) {
		super(elem, options)

		this.scope = options.scope
		this.method = options.method
		this.endpoint = options.endpoint

		this.behaviorId = Cookies.get(this.scope)
		this.scale = Cookies.get('responsive') ? Cookies.get('responsive').split(' ')[1] : 'unknown'
	}

	start () {
		super.start()
		this.send('pageview', '', location.pathname + location.search)
	}

	newPage (oldPath, newPath) {
		this.send('pageview', oldPath, newPath)
	}

	didBreakpoint (scale) {
		this.scale = scale
	}

	async send (type, oldPath, path) {
		const payload = {
			type: type,
			behaviorId: this.behaviorId,
			path: path,
			hasAccount: Cookies.get('have-account'),
			scale: this.scale,
			referer: oldPath
		}

		try {
			const request = await fetch(this.endpoint, {
				method: this.method,
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify(payload)
			})

			const data = await request.json()

			if (data && data.status === 'ok') {
				if (this.behaviorId !== data.behaviorId) {
					this.behaviorId = data.behaviorId
					Cookies.set(this.scope, this.behaviorId, {
						path: '/',
						domain: publicOptions.COOKIE_DOMAIN ? publicOptions.COOKIE_DOMAIN : document.location.hostname,
						expires: 365
					})
				}
			}
		} catch (e) {
			CMSUtils.flashAjaxStatus('error', e.message || 'error')
		}
	}
}

utils.registerSargassoClass('Analytics', Analytics)

export {
	Analytics
}
