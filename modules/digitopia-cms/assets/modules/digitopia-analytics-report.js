import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../../digitopia/js/controller.js';

function digitopiaAnalyticsReport(elem, options) {
	this.element = $(elem);

	var self = this;

	this.endpoint = this.element.data('endpoint');

	this.start = function () {
		self.load();
	}

	this.stop = function () {

	}

	this.load = function () {
		let payload = {};
		$.ajax({
				method: 'POST',
				url: self.endpoint,
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify(payload),
			})
			.done(function (data, textStatus, jqXHR) {
				self.element.html('<pre>' + JSON.stringify(data, '', 2) + '</pre>')
			})
			.fail(function (jqXHR, textStatus, errorThrown) {});
	}
}


$.fn.digitopiaAnalyticsReport = GetJQueryPlugin('digitopiaAnalyticsReport', digitopiaAnalyticsReport);

export {
	digitopiaAnalyticsReport
}
