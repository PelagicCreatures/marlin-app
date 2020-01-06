import $ from 'jquery'

import {
	ResponsiveElement, registerClass
}
	from '../../../responsive/lib/ResponsiveElement'

class paginationController extends ResponsiveElement {
	constructor (elem, options) {
		super(elem, options)
		this.jqElement = $(elem)
	}

	start () {
		let index
		const pages = this.jqElement.find('.pagination-page')
		const selipsis = this.jqElement.find('.pagination-elipsis-start')
		const eelipsis = this.jqElement.find('.pagination-elipsis-end')
		if (pages.length > 9) {
			for (let i = 0; i < pages.length; i++) {
				if ($(pages[i]).hasClass('active')) {
					index = i
				}
			}
			let start = index - 4
			let end = index + 4

			if (start < 0) {
				end = -start + end
				start = 0
			}
			if (end > pages.length) {
				start = start + pages.length - end
				end = pages.length
			}
			for (let i = 0; i < pages.length; i++) {
				if (i < start || i > end) {
					$(pages[i]).hide()
				}
			}
			if (start === 0) {
				$(selipsis).hide()
			}
			if (end + 2 > pages.length) {
				$(eelipsis).hide()
			}
		} else {
			$(selipsis).hide()
			$(eelipsis).hide()
		}
	};
}

registerClass('paginationController', paginationController)

export {
	paginationController
}
