// digitopia/geometry.js - digitopia.js geometry controller
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

import Cookies from "js-cookie";


var digitopiaGeometry = function (element, options) {
	this.element = $(element);

	var self = this;

	this.orientation = undefined;
	this.scale = undefined;
	this.disabled = false;
	this.forceScale = undefined;

	this.config = $.extend({
		breakpoints: [{
			className: 'tiny',
			maxWidth: 480
		}, {
			className: 'small',
			maxWidth: 768
		}, {
			className: 'medium',
			maxWidth: 980
		}, {
			className: 'large',
			maxWidth: 1024
		}, {
			className: 'huge',
			maxWidth: undefined
		}, ],
		cookieDomain: undefined
	}, options || {});

	this.widths = [];
	this.classes = [];

	this.disableResponsive = function (scale) {
		$('body').addClass('disable-responsive');
		this.disabled = true;
		this.forceScale = scale;
		this.detectGeometry();
	}

	this.enableResponsive = function () {
		$('body').removeClass('disable-responsive');
		this.disabled = false;
		this.forceScale = '';
		this.detectGeometry();
	}

	this.start = function () {
		var css = '.show-hide{display:none;}\n';
		this.widths.push(0);
		for (var i = 0; i < this.config.breakpoints.length; i++) {
			if (this.config.breakpoints[i].maxWidth) {
				this.widths.push(this.config.breakpoints[i].maxWidth);
			}
			this.classes.push(this.config.breakpoints[i].className);

			css += '.' + this.config.breakpoints[i].className + ' .hidden-' + this.config.breakpoints[i].className + '{display:none;}\n';
			css += '.not-' + this.config.breakpoints[i].className + ' .hidden-not-' + this.config.breakpoints[i].className + '{display:none;}\n';
			css += '.' + this.config.breakpoints[i].className + ' .shown-' + this.config.breakpoints[i].className + '{display:block;}\n';
			css += '.not-' + this.config.breakpoints[i].className + ' .shown-not-' + this.config.breakpoints[i].className + '{display:block;}\n';
		}

		var style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = css;
		document.getElementsByTagName('head')[0].appendChild(style);

		this.element.on('DigitopiaDidResize.digitopiaGeometry', function (e) {
			e.stopPropagation();
			if (e.target === this) {
				self.detectGeometry();
			}
		});

		this.detectGeometry();

		this.element.on('DigitopiaNewInstance.digitopiaGeometry', function (e, element) {
			e.stopPropagation();
			if (e.target === this) {
				$(element).trigger('DigitopiaScaleChanged', self.scale);
				$(element).trigger('DigitopiaOrientationChanged', self.orientation);
			}
		});
	};

	this.stop = function () {
		this.element.off('DigitopiaDidResize.digitopiaGeometry');
		this.element.off('DigitopiaNewInstance.digitopiaGeometry');
	};

	this.detectGeometry = function () {
		var newOrientation = this.orientation;
		var newScale = this.classes[this.widths.length - 1];

		if ($(window).width() < $(window).height()) {
			newOrientation = 'portrait';
		}
		else {
			newOrientation = 'landscape';
		}

		if (this.disabled) {
			newScale = this.forceScale;
		}
		else {
			var ww = $(window).width();
			for (var i = 0; i < this.widths.length - 1; i++) {
				if (ww >= this.widths[i] && ww < this.widths[i + 1]) {
					newScale = this.classes[i];
					break;
				}
			}
		}

		var changed = 0;

		if (newScale !== this.scale) {
			++changed;
			for (var i = 0; i < this.classes.length; i++) {
				if (this.classes[i] !== newScale) {
					$('body').addClass('not-' + this.classes[i]);
					$('body').removeClass(this.classes[i]);
					$('body').removeClass('shown-' + this.classes[i]);
					$('body').removeClass('hidden-' + this.classes[i]);
				}
				else {
					$('body').removeClass('not-' + this.classes[i]);
				}
			}
			$('body').addClass(newScale);
			$('body').addClass('shown-' + newScale);
			$('body').addClass('hidden-' + newScale);

			$('.DigitopiaInstance').trigger("DigitopiaScaleChanged", newScale);
		}

		this.scale = newScale;

		if (newOrientation !== this.orientation) {
			++changed;
			$('body').removeClass('portrait').removeClass('landscape');
			$('body').addClass(newOrientation);
			$('.DigitopiaInstance').trigger("DigitopiaOrientationChanged", newOrientation);
		}

		this.orientation = newOrientation;

		if (changed) {
			this.setHints();
		}
	}

	this.setHints = function () {
		var classes = '';

		if (this.orientation) {
			if (classes) {
				classes += ' ';
			}
			classes += this.orientation;
		}

		if (this.scale) {
			if (classes) {
				classes += ' ';
			}
			classes += this.scale;
		}

		if (classes !== this.getCookie('responsive')) {
			this.setCookie('responsive', classes);
		}
	};

	this.getCookie = function (key) {
		return Cookies.get(key);
	};

	this.setCookie = function (key, value, expires) {
		var options = {
			path: '/',
			domain: this.config.cookieDomain,
			expires: expires
		};
		Cookies.set(key, value, options);
	};

	this.deleteCookie = function (key) {
		this.setCookie(key, null);
	};

};

$.fn.digitopiaGeometry = GetJQueryPlugin('digitopiaGeometry', digitopiaGeometry);

export {
	digitopiaGeometry
}
