import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../modules/digitopia/js/controller.js';

function flexTable(elem, options) {
	this.element = $(elem);
	this.data = $(this.element).clone(true, true);
	var self = this;

	self.breakOn = $(this.element).data('break') ? $(this.element).data('break').split(/,/) : []

	this.start = function () {
		this.element.on('DigitopiaScaleChanged', function (e, scale) {
			if (e.target === this) {
				self.draw(scale);
			}
		});
	};

	this.stop = function () {
		this.element.off('DigitopiaScaleChanged');
	};

	this.cloneAttr = function (from, to) {
		var dataAttributes = $(from).data();
		for (let prop in dataAttributes) {
			to.attr('data-' + prop, dataAttributes[prop])
		}
		var classes = $(from).attr('class');
		to.addClass(classes);
	}

	this.draw = function (scale) {
		if (self.breakOn.indexOf(scale) !== -1) {
			self.element.addClass('folded');
		}
		else {
			self.element.removeClass('folded');
		}

		var structure = $(this.data).children('ul');

		var head = $(structure[0]).children('li');
		var rows = []
		var rowheaders = []
		var r = $(structure[1]).children('li');
		for (var i = 0; i < r.length; i++) {
			let td = $('<td class="flextable-row-header">');
			if (self.breakOn.indexOf(scale) !== -1) {
				td.attr('colspan', 2);
			}
			if ($(head[0]).html()) {
				td.html($(head[0]).html() + ': ' + r[i].firstChild.data);
			}
			else {
				td.html(r[i].firstChild.data);
			}

			self.cloneAttr(r[i], td);

			rowheaders.push(td);

			rows.push($(r[i]).children('ul')[0]);
		}

		var html = '';
		if (self.breakOn.indexOf(scale) === -1) {
			var html = '<table class="table table-bordered flextable-table"><tr class="flextable-row">';
			for (var h = 0; h < head.length; h++) {
				if ($(head[h]).html()) {
					html += '<th class="flextable-header">' + $(head[h]).html() + '</th>';
				}
			}
			html += '</tr>';
			for (var r = 0; r < rows.length; r++) {
				var cols = $(rows[r]).children('li');

				html += '<tr class="flextable-row">'
				html += rowheaders[r][0].outerHTML;
				for (var c = 0; c < cols.length; c++) {
					let td = $('<td class="flextable-cell">');
					td.html($(cols[c]).html());
					self.cloneAttr($(cols[c]), td)
					html += td[0].outerHTML;
				}
				html += '</tr>'
			}
			html += '</table>'
		}
		else {
			var html = '<table class="table table-bordered flextable-table">';
			for (var r = 0; r < rows.length; r++) {
				html += '<tr class="flextable-row">' + rowheaders[r][0].outerHTML + '</tr>';
				var cols = $(rows[r]).children('li');
				for (var c = 0; c < cols.length; c++) {
					html += '<tr class="flextable-row">';
					if ($(head[c + 1]).html()) {
						html += '<td class="flextable-header">' + $(head[c + 1]).html() + '</td>';
					}
					html += '<td class="flextable-cell">' + $(cols[c]).html() + '</td>';
					html += '</tr>'
				}
			}
			html += '</table>'
		}

		$(this.element).html(html);
		$(this.element).show();
		didInjectContent(this.element);
	}
}
$.fn.flexTable = GetJQueryPlugin('flexTable', flexTable);

export {
	flexTable
}
