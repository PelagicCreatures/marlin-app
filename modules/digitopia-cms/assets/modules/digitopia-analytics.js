import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../../digitopia/js/controller.js';

import Cookies from "js-cookie";

import * as Utils from './utils';

function digitopiaAnalytics(elem, options) {
	this.element = $(elem);

	var self = this;

	this.scope = options.scope;
	this.method = options.method;
	this.endpoint = options.endpoint;

	this.behaviorId = Cookies.get(this.scope);
	this.scale = Cookies.get('responsive') ? Cookies.get('responsive').split(' ')[1] : 'unknown';

	this.start = function () {
		this.element.on('DigitopiaScaleChanged', function (e, scale) {
			if (e.target === this) {
				self.scale = scale;
			}
		});

		this.element.on('DigitopiaWillLoadNewPage', function (e, oldPath, newPath) {
			if (e.target === this) {
				self.send('pageview', oldPath, newPath)
			}
		});

		self.send('pageview', '', location.pathname + location.search);
	}

	this.stop = function () {
		this.element.off('DigitopiaScaleChanged');
		this.element.off('DigitopiaWillLoadNewPage');
	}

	this.send = function (type, oldPath, path) {
		let payload = {
			type: type,
			behaviorId: self.behaviorId,
			path: path,
			hasAccount: Cookies.get('have-account'),
			scale: self.scale,
			referer: oldPath
		}

		$.ajax({
				method: self.method,
				url: self.endpoint,
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify(payload),
			})
			.done(function (data, textStatus, jqXHR) {
				if (data && data.status === 'ok') {
					if (self.behaviorId !== data.behaviorId) {
						self.behaviorId = data.behaviorId;
						Cookies.set(self.scope, self.behaviorId, {
							path: '/',
							domain: publicOptions.COOKIE_DOMAIN ? publicOptions.COOKIE_DOMAIN : document.location.hostname,
							expires: 365
						});
					}
				}
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				var message = errorThrown;
				if (jqXHR.responseJSON) {
					if (jqXHR.responseJSON.errors) {
						message = '';
						for (var i = 0; i < jqXHR.responseJSON.errors.length; i++) {
							if (message) {
								message += ', ';
							}
							message += jqXHR.responseJSON.errors[i];
						}
					}
					else {
						message = jqXHR.responseJSON.status;
					}
				}
				Utils.flashAjaxStatus('error', message);
			});
	}
}

$.fn.digitopiaAnalytics = GetJQueryPlugin('digitopiaAnalytics', digitopiaAnalytics);

export {
	digitopiaAnalytics
}
