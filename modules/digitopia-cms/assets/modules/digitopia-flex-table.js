import $ from 'jquery'

import {
	Reagent, registerClass
}
	from '../../../reagent/lib/Reagent'

import {
	elementTools
}
	from '../../../reagent/lib/utils'

import {
	didInjectContent
}
	from './utils'

import Cookies from 'js-cookie'

class flexTable extends Reagent {
	constructor (elem, options) {
		super(elem, options)
		this.jqElement = $(elem)
		this.data = this.jqElement.clone(true, true)
		this.breakOn = this.jqElement.data('break') ? this.jqElement.data('break').split(/,/) : []
	}

	start () {
		super.start()
		const scale = Cookies.get('responsive')
		this.draw(scale)
	};

	sleep () {
		super.sleep()
	};

	didBreakpoint (scale) {
		this.draw(scale)
	}

	cloneAttr (from, to) {
		const dataAttributes = $(from).data()
		for (const prop in dataAttributes) {
			to.attr('data-' + prop, dataAttributes[prop])
		}
		const classes = $(from).attr('class')
		to.addClass(classes)
	}

	draw (scale) {
		if (this.breakOn.indexOf(scale) !== -1) {
			this.jqElement.addClass('folded')
		} else {
			this.jqElement.removeClass('folded')
		}

		const structure = $(this.data).children('ul')
		const head = $(structure[0]).children('li')
		const rows = []
		const rowheaders = []
		const r = $(structure[1]).children('li')
		for (let i = 0; i < r.length; i++) {
			const td = $('<td class="flextable-row-header">')
			if (this.breakOn.indexOf(scale) !== -1) {
				td.attr('colspan', 2)
			}
			if ($(head[0]).html()) {
				td.html($(head[0]).html() + ': ' + r[i].firstChild.data)
			} else {
				td.html(r[i].firstChild.data)
			}

			this.cloneAttr(r[i], td)

			rowheaders.push(td)

			rows.push($(r[i]).children('ul')[0])
		}

		var html = ''
		if (this.breakOn.indexOf(scale) === -1) {
			html = '<table class="table table-bordered flextable-table"><tr class="flextable-row">'
			for (let h = 0; h < head.length; h++) {
				if ($(head[h]).html()) {
					html += '<th class="flextable-header">' + $(head[h]).html() + '</th>'
				}
			}
			html += '</tr>'
			for (let r = 0; r < rows.length; r++) {
				var cols = $(rows[r]).children('li')

				html += '<tr class="flextable-row">'
				html += rowheaders[r][0].outerHTML
				for (var c = 0; c < cols.length; c++) {
					const td = $('<td class="flextable-cell">')
					td.html($(cols[c]).html())
					this.cloneAttr($(cols[c]), td)
					html += td[0].outerHTML
				}
				html += '</tr>'
			}
			html += '</table>'
		} else {
			html = '<table class="table table-bordered flextable-table">'
			for (let r = 0; r < rows.length; r++) {
				html += '<tr class="flextable-row">' + rowheaders[r][0].outerHTML + '</tr>'
				const cols = $(rows[r]).children('li')
				for (let c = 0; c < cols.length; c++) {
					html += '<tr class="flextable-row">'
					if ($(head[c + 1]).html()) {
						html += '<td class="flextable-header">' + $(head[c + 1]).html() + '</td>'
					}
					html += '<td class="flextable-cell">' + $(cols[c]).html() + '</td>'
					html += '</tr>'
				}
			}
			html += '</table>'
		}

		this.jqElement.html(html)
		this.jqElement.show()
		didInjectContent(this.jqElement)
	}
}

registerClass('flexTable', flexTable)

export {
	flexTable
}
