import $ from 'jquery'

import {
	Sargasso, registerSargassoClass
}
	from '@pelagiccreatures/sargasso'

import Cookies from 'js-cookie'

import * as Utils from './utils'

class digitopiaAnalytics extends Sargasso {
	constructor (elem, options) {
		super(elem, options)
		this.jqElement = $(elem)

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

	send (type, oldPath, path) {
		const payload = {
			type: type,
			behaviorId: this.behaviorId,
			path: path,
			hasAccount: Cookies.get('have-account'),
			scale: this.scale,
			referer: oldPath
		}

		$.ajax({
			method: this.method,
			url: this.endpoint,
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(payload)
		})
			.done((data, textStatus, jqXHR) => {
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
			})
			.fail((jqXHR, textStatus, errorThrown) => {
				var message = errorThrown
				if (jqXHR.responseJSON) {
					if (jqXHR.responseJSON.errors) {
						message = ''
						for (var i = 0; i < jqXHR.responseJSON.errors.length; i++) {
							if (message) {
								message += ', '
							}
							message += jqXHR.responseJSON.errors[i]
						}
					} else {
						message = jqXHR.responseJSON.status
					}
				}
				Utils.flashAjaxStatus('error', message)
			})
	}
}

registerSargassoClass('digitopiaAnalytics', digitopiaAnalytics)

export {
	digitopiaAnalytics
}
