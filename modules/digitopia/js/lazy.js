// digitopia/lazy.js - digitopia.js lazy image controller
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

var digitopiaLazy = function (element, options) {
	this.element = $(element);

	var self = this;

	this.id = element.id;
	this.scale = undefined;

	this.loaded = false;

	this.settings = $.extend({
		enabledScales: $(this.element).data('enabled-scales') ? $(this.element).data('enabled-scales').split(',') : []
	}, options || {});

	this.start = function () {
		if (!this.loaded) {
			$(this.element).addClass('responsive-loading');

			this.element.on('DigitopiaScaleChanged.' + this.id, function (e, scale) {
				e.stopPropagation();
				if (e.target === this) {
					self.scale = scale;
					self.lazy();
				}
			});

			this.element.on('DigitopiaDidScroll.' + this.id, function (e, scale) {
				e.stopPropagation();
				if (e.target === this) {
					self.lazy();
				}
			});

			this.element.on('DigitopiaDidResize.' + this.id, function (e, scale) {
				e.stopPropagation();
				if (e.target === this) {
					self.lazy();
				}
			});

			this.element.on('DigitopiaLazy.' + this.id, function (e, force) {
				e.stopPropagation();
				if (e.target === this) {
					self.lazy(force);
				}
			});

			this.lazy();
		}
	};

	this.stop = function () {
		this.element.off('DigitopiaScaleChanged.' + this.id);
		this.element.off('DigitopiaDidScroll.' + this.id);
		this.element.off('DigitopiaDidResize.' + this.id);
		this.element.off('DigitopiaLazy.' + this.id);
	};

	this.want = function () {
		if (this.settings.enabledScales.length) {
			if (this.scale) {
				return this.settings.enabledScales.indexOf(this.scale) !== -1;
			}
			else {
				return false;
			}
		}
		else {
			return true;
		}
	};

	this.lazy = function (force) {
		if (!this.loaded && this.want()) {
			if (force || ($.inviewport(this.element, {
					threshold: 0
				}) && $(this.element).is(':visible'))) {
				this.element.removeClass('responsive-loading');
				this.element.trigger('digitopiaLazyLoad');
				this.loaded = true;
			}
		}
	};

	// listent for events

};

var digitopiaLazyImg = function (element, options) {
	this.element = $(element);

	var self = this;

	this.id = element.id;

	this.loaded = false;

	this.scale = undefined;
	this.loadedScale = undefined;

	this.start = function () {
		//$(this.element).attr('src','/digitopia/images/lazy.gif');

		this.element.on('digitopiaLazyLoad.' + this.id, function (e, force) {
			e.stopPropagation();
			self.lazy(force);
		});

		this.element.on('DigitopiaScaleChanged.' + this.id, function (e, scale) {
			e.stopPropagation();
			self.scale = scale;
			if (self.loaded && self.loadedScale != self.scale) {
				self.load();
			}
		});

		setTimeout(function () {
			self.element.digitopiaLazy();
		}, 0);
	};

	this.stop = function () {
		this.element.off('digitopiaLazyLoad.' + this.id);
		this.element.off('DigitopiaScaleChanged.' + this.id);
	};

	this.lazy = function (force) {
		if (!this.loaded) {
			this.load();
		}
	};

	this.load = function (force) {
		var src = $(this.element).data('lazy-src');

		if ($(this.element).data('lazy-' + this.scale + '-src')) {
			src = $(this.element).data('lazy-' + this.scale + '-src');
		}

		if ($(self.element).attr('src') != src) {
			//flash('lazy ' + self.id + ' loading: ' + src + ' for scale ' + self.scale);
			$(self.element).css({
				opacity: 0
			}).attr('src', src).load(function () {
				if (this.complete && typeof this.naturalWidth !== "undefined" && this.naturalWidth !== 0) {
					$(this).data('width', this.naturalWidth);
					$(this).data('height', this.naturalHeight);
					if ($(this).data('inViewPort')) {
						$(this).data('inViewPort').fitElements();
					}

					// next tick - do this after fitElements renders
					var instance = this;
					setTimeout(function () {
						$(instance).animate({
							opacity: 1
						}, 250);
					}, 0);
				}
			}).error(function () {
				//$(this).attr('src','/digitopia/images/lazy.gif');
			});
		}
		this.loaded = true;
		this.loadedScale = this.scale;
	};
};

$.fn.digitopiaLazy = GetJQueryPlugin('digitopiaLazy', digitopiaLazy);
$.fn.digitopiaLazyImg = GetJQueryPlugin('digitopiaLazyImg', digitopiaLazyImg);

export {
	digitopiaLazy, digitopiaLazyImg
}
