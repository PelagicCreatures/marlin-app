import $ from 'jquery'

import {
	Sargasso, utils
}
	from '@pelagiccreatures/sargasso'

class digitopiaAnalyticsReport extends Sargasso {
	constructor (elem, options) {
		super(elem, options)
		this.jqElement = $(elem)
		this.endpoint = this.jqElement.data('endpoint')
	}

	start () {
		super.start()
		this.load()
	}

	sleep () {

	}

	load () {
		const payload = {}
		$.ajax({
			method: 'POST',
			url: this.endpoint,
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(payload)
		})
			.done((data, textStatus, jqXHR) => {
				this.jqElement.html('<pre>' + JSON.stringify(data, '', 2) + '</pre>')
			})
			.fail((jqXHR, textStatus, errorThrown) => {})
	}
}

utils.registerSargassoClass('digitopiaAnalyticsReport', digitopiaAnalyticsReport)

export {
	digitopiaAnalyticsReport
}
