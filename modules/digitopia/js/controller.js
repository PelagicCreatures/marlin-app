// digitopia/controller.js - digitopia.js responsive element controller
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


// this should be attached to the document body as follows
//
// options = {
//		'geometry': { 'enabled' : true, 'widths': [], 'classes': [], cookieDomain: '' }
// }
// $(body).digitopiaController(options);

import $ from "jquery";

import {
	digitopiaGeometry
}
from './geometry';

import {
	digitopiaHijax
}
from './hijax';


var gResponsiveUniqueId = 0;
var gResponsiveFlashEvents = true;

function GetJQueryPlugin(classname, obj) {
	return function (options) {
		return this.each(function () {
			var element = $(this);
			if (!this.id) { // self assigned id (so $.off works when events are namespaced by id)
				this.id = 'DiGiToPiA-' + ++gResponsiveUniqueId;
			}
			if (!element.data(classname)) {
				element.addClass('DigitopiaInstance');
				try {
					var instance = new obj(this, options);
					element.data(classname, instance);
					if (instance.stop) {
						element.on('DigitopiaStop', function (event) {
							event.stopPropagation();
							if (event.target === this) {
								instance.stop();
							}
						});
					}
					if (instance.start) {
						window.setTimeout(function () {
							instance.start();
							$('.DigitopiaInstance').trigger('DigitopiaNewInstance', element);
						}, 0);
					}
				}
				catch (err) {
					alert('Could not initialize element:' + this.id + ' jsclass:' + classname + ' error:' + err);
				}
			}
		})
	}
}

var digitopiaController = function (element, options) {
	this.element = $(element);

	var self = this;

	this.config = $.extend({
		geometry: undefined,
		lazy: undefined,
		ajax: undefined,
		hijax: undefined,
		parallax: undefined,
		coverResize: false
	}, options || {});

	this.start = function () {
		if (this.config.geometry && this.config.geometry.enabled) {
			this.config.geometry.controller = this;
			setTimeout(function () {
				self.element.digitopiaGeometry(self.config.geometry);
			}, 0);
		}
		if (this.config.hijax && this.config.hijax.enabled) {
			this.config.hijax.controller = this;
			setTimeout(function () {
				self.element.digitopiaHijax(self.config.hijax);
			}, 0);
		}

		this.element.lazyInstantiate();

		this.instantiateElements();

		self.scrollTimer = undefined;

		$(window).scroll(function () {
			if (!self.scrollTimer) {
				self.scrollTimer = setTimeout(function () {
					self.scrollTimer = undefined;
					$('.DigitopiaInstance').trigger('DigitopiaDidScroll');
				}, 250);
			}
		});

		self.resizeTimer = undefined;

		$('body').outerWidth($(window).innerWidth());

		$(window).resize(function () {
			if (self.resizeTimer) {
				clearTimeout(self.resizeTimer);
			}
			else {
				//console.log('start ',$(window).width());
				if (self.config.coverResize) {
					$('body').css({
						'opacity': 0.3
					});
				}
			}
			self.resizeTimer = setTimeout(function () {
				//console.log('end ',$(window).width());
				$('body').outerWidth($(window).innerWidth());
				self.resizeTimer = undefined;
				$('.DigitopiaInstance').trigger('DigitopiaDidResize');
				if (self.config.coverResize) {
					$('body').css({
						'opacity': 1
					});
				}
			}, 100);
		});

	};

	this.stop = function () {};

	this.instantiateElements = function () {
		var didInstantiate = false;
		$("*[data-jsclass]").each(function () {
			var classnames = $(this).data('jsclass').split(',');
			for (var i = 0; i < classnames.length; i++) {
				var classname = classnames[i];
				if (!$(this).data(classname)) {
					didInstantiate = true;
					var handler = null;
					try {
						if ($(this)[classname]) { // try jquery plugin method first
							$(this)[classname]();
						}
						else {
							// instantiate the object
							handler = new window[classname](this);

							// cache a reference in the element
							$(this).data(classname, handler);

							// start the object's behavior
							if (handler.start) {
								var element = this;
								window.setTimeout(function () {
									handler.start();
									$('.DigitopiaInstance').trigger('DigitopiaNewInstance', element);
								}, 0);
							}

						}
					}
					catch (err) {
						alert('Could not initialize element:' + this.id + ' jsclass:' + classname + ' error:' + err);
					}
				}
			}
		});

		if (didInstantiate) {
			$('.DigitopiaInstance').trigger('DigitopiaReady', this);
		}

	};

	// listent for events

	this.element.on('DigitopiaInstantiate', function (e) {
		e.stopPropagation();
		if (e.target === this) {
			self.instantiateElements();
			self.element.data('lazyInstantiate').watchScroll();
		}
	});

};


function lazyInstantiate(elem, options) {
	this.element = $(elem);
	var self = this;

	this.start = function () {
		this.element.on('DigitopiaDidScroll', function (event) {
			if (event.target === this) {
				self.watchScroll();
			}
		});
		self.watchScroll();
	};

	this.stop = function () {
		this.element.off('DigitopiaDidScroll');
	};

	this.watchScroll = function () {
		$('.lazy-instantiate:in-viewport').each(function () {
			if ($(this).is(':visible')) {
				$(this).removeClass('lazy-instantiate');
				var classes = $(this).data('lazy-jsclass').split(/,\s*/);
				for (var i = 0; i < classes.length; i++) {
					$(this)[classes[i]]();
				};
			}
		});
	};
}

$.fn.digitopiaController = GetJQueryPlugin('digitopiaController', digitopiaController);
$.fn.lazyInstantiate = GetJQueryPlugin('lazyInstantiate', lazyInstantiate);

export {
	GetJQueryPlugin,
	digitopiaController
}
