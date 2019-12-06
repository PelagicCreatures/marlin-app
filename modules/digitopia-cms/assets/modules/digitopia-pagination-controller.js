import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../../digitopia/js/controller.js';

function paginationController(elem, options) {
	this.element = $(elem);

	this.settings = $.extend({}, options || {});

	var self = this;

	this.start = function () {
		var index;
		var pages = this.element.find('.pagination-page');
		var selipsis = this.element.find('.pagination-elipsis-start');
		var eelipsis = this.element.find('.pagination-elipsis-end');
		if (pages.length > 9) {
			for (var i = 0; i < pages.length; i++) {
				if ($(pages[i]).hasClass('active')) {
					index = i;
				}
			}
			var start = index - 4;
			var end = index + 4;

			if (start < 0) {
				end = -start + end;
				start = 0;
			}
			if (end > pages.length) {
				start = start + pages.length - end;
				end = pages.length;
			}
			for (var i = 0; i < pages.length; i++) {
				if (i < start || i > end) {
					$(pages[i]).hide();
				}
			}
			if (start == 0) {
				$(selipsis).hide();
			}
			if (end + 2 > pages.length) {
				$(eelipsis).hide();
			}

		}
		else {
			$(selipsis).hide();
			$(eelipsis).hide();
		}
	};

	this.stop = function () {};

}
$.fn.paginationController = GetJQueryPlugin('paginationController', paginationController);

export {
	paginationController
}
