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
			self.draw(scale);
		});
	};

	this.stop = function () {
		this.element.off('DigitopiaScaleChanged');
	};

	this.draw = function (scale) {

		var structure = $(this.data).children('ul');

		var head = $(structure[0]).children('li');
		var rows = []
		var rowheaders = []
		var r = $(structure[1]).children('li');
		for (var i = 0; i < r.length; i++) {
			rowheaders.push(r[i].firstChild.data);
			rows.push($(r[i]).children('ul')[0]);
		}

		var html = '';
		if (self.breakOn.indexOf(scale) === -1) {
			var html = '<table class="table table-bordered flextable-table"><tr class="flextable-row">';
			for (var h = 0; h < head.length; h++) {
				html += '<th class="flextable-header">' + $(head[h]).html() + '</th>';
			}
			html += '</tr>';
			for (var r = 0; r < rows.length; r++) {
				var cols = $(rows[r]).children('li');

				html += '<tr class="flextable-row">'
				html += '<td class="flextable-row-header">' + rowheaders[r] + '</td>';
				for (var c = 0; c < cols.length; c++) {
					html += '<td class="flextable-cell">' + $(cols[c]).html() + '</td>';
				}
				html += '</tr>'
			}
			html += '</table>'
		}
		else {
			var html = '<table class="table table-bordered flextable-table">';
			for (var r = 0; r < rows.length; r++) {
				html += '<tr class="flextable-row"><td class="flextable-row-header" colspan=2>' + rowheaders[r] + '</td></tr>';
				var cols = $(rows[r]).children('li');
				for (var c = 0; c < cols.length; c++) {
					html += '<tr class="flextable-row">';
					html += '<td class="flextable-header">' + $(head[c + 1]).html() + '</td>';
					html += '<td class="flextable-cell">' + $(cols[c]).html() + '</td>';
					html += '</tr>'
				}
			}
			html += '</table>'
		}

		$(this.element).html(html);
		$(this.element).show();
	}
}
$.fn.flexTable = GetJQueryPlugin('flexTable', flexTable);

export {
	flexTable
}
