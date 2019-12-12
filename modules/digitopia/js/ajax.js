// digitopia/ajax.js - digitopia.js ajax controller
// status: api stable
// version: 2.0

/*
    Copyright (C) 2013 Michael Rhodes

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import $ from "jquery";
import {
	GetJQueryPlugin
}
from './controller';

var digitopiaAjax = function (element, options) {
	this.element = $(element);
	this.id = element.id;
	var self = this;

	this.settings = $.extend({
		src: $(this.element).data('src') ? $(this.element).data('src') : undefined,
		type: $(this.element).data('type') ? $(this.element).data('type') : 'html',
		inline: $(this.element).data('inline'),
		noLazy: $(this.element).data('no-lazy') ? $(this.element).data('no-lazy') : false,
		showLoading: $(this.element).data('show-loading') ? $(this.element).data('show-loading') : false,
		args: $(this.element).data('args') ? JSON.parse($(this.element).data('args')) : {},
	}, options || {});

	this.loaded = false;

	this.start = function () {
		if (!this.settings.noLazy) {
			this.element.on('digitopiaLazyLoad.' + this.id, function (e, force) {
				e.stopPropagation();
				if (e.target === this) {
					self.ajaxLayer();
				}
			});
			setTimeout(function () {
				self.element.digitopiaLazy(self.settings);
			}, 0);
		}
		else {
			this.ajaxLayer();
		}
	};

	this.stop = function () {
		if (!this.settings.noLazy) {
			this.element.off('digitopiaLazyLoad.' + this.id);
		}
	};

	this.reload = function () {
		this.loaded = false;
		this.ajaxLayer(true);
	};

	this.ajaxLayer = function () {
		if (!this.loaded) {
			this.loaded = true;
			this.ajaxRequest();
			if (this.settings.showLoading) {
				$(this.element).addClass('responsive-loading');
			}
		}
	};

	this.ajaxRequest = function () {
		var path = this.settings.src;
		if (typeof (rewriteUrls) !== 'undefined') {
			path = rewriteUrls(path);
		}

		$.ajax({
			type: 'GET',
			url: path + '?' + $.param(this.settings.args),
			dataType: this.settings.type,
			success: function (result) {
				self.ready(result);
			},
			error: function (request, status, error) {
				if (request.responseText) {
					alert(request.responseText);
				}
			}
		});
	};

	this.ready = function (response) {
		this.element.removeClass('responsive-loading');
		if (this.settings.inline) {
			this.element.empty().append(response);
			if ($('body').data('digitopiaHijax')) {
				$('body').data('digitopiaHijax').hijaxLinks(this.element);
			}
			$('body').trigger('DigitopiaInstantiate');
		}
		this.element.trigger('data', response);
	};

};

$.fn.digitopiaAjax = GetJQueryPlugin('digitopiaAjax', digitopiaAjax);

export {
	digitopiaAjax
}
