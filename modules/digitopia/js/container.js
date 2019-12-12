// digitopia/container.js - digitopia.js container controller
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

var digitopiaContainer = function (elem, options) {
	this.element = $(elem);
	var self = this;
	this.id = elem.id;

	this.settings = $.extend({
		scales: this.element.data('scales') ? this.element.data('scales').split(/\s*,\s*/) : [],
		followElementWidth: this.element.data('follow-element-width'),
		followElementHeight: this.element.data('follow-element-height'),
		fillContainer: this.element.data('fill-container')
	}, options || {});

	this.active = undefined;

	if (!this.settings.scales.length) {
		this.active = true;
	}

	this.origHeight = elem.style.height;
	this.origWidth = elem.style.width;

	this.lastHeight = undefined;
	this.lastWidth = undefined;

	this.listenTo = {};

	this.following = 0;

	if (this.settings.followElementWidth) {
		++this.following;
		this.listenTo[$(this.settings.followElementWidth).attr('id')] = true;
	}
	if (this.settings.followElementHeight) {
		++this.following;
		this.listenTo[$(this.settings.followElementHeight).attr('id')] = true;
	}
	if (this.settings.fillContainer) {
		++this.following;
		if (this.settings.fillContainer === 'parent') {
			setTimeout(function () {
				self.element.parent().digitopiaContainer();
			}, 0);
			this.listenTo[this.element.parent().attr('id')] = true;
		}
		else {
			setTimeout(function () {
				$(self.settings.fillContainer).digitopiaContainer();
			}, 0);
			this.listenTo[$(this.settings.fillContainer).attr('id')] = true;
		}
	}

	this.start = function () {
		this.element.on('DigitopiaScaleChanged.' + this.id, function (e, scale) {
			e.stopPropagation();
			if (e.target === this) {
				self.watchScale(scale);
			}
		});

		if (this.following) {
			for (var id in this.listenTo) {
				//console.log(this.id + ' is listenting to ' + id);
				this.element.on('digitopiaContainerDidResize' + id + '.' + this.id, function (e) {
					e.stopPropagation();
					if (e.target === this) {
						self.handleResize();
					}
				});
			}
		}
		else {
			//console.log(this.id + ' is listenting to all');
			this.element.on('DigitopiaDidResize.' + this.id, function (e) {
				e.stopPropagation();
				if (e.target === this) {
					self.handleResize();
				}
			});
		}

		this.handleResize();
	};

	this.stop = function () {
		this.element.off('DigitopiaScaleChanged.' + this.id);

		if (this.following) {
			for (var id in this.listenTo) {
				this.element.off('digitopiaContainerDidResize' + id + '.' + this.id);
			}
		}
		else {
			this.element.off('DigitopiaDidResize.' + this.id);
		}
	};

	this.watchScale = function (scale) {
		var wasActive = this.active;

		if (this.settings.scales.length) {
			this.active = false;
			for (var i = 0; i < this.settings.scales.length; i++) {
				if (this.settings.scales[i] === scale) {
					this.active = true;
				}
			}
		}
		else {
			this.active = true;
		}

		if (!this.active) {
			this.element.css({
				'width': this.origWidth ? this.origWidth : "",
				'height': this.origHeight ? this.origHeight : ""
			});
		}

		if (wasActive != this.active) {
			//console.log(this.id + ' now active? ' + this.active);
		}

		this.handleResize();
	};

	this.handleResize = function () {
		var change = false;

		var w = this.element.innerWidth();
		var h = this.element.innerHeight();

		if (this.active || this.active === undefined) {
			if (this.settings.followElementWidth) {
				if (w != $(this.settings.followElementWidth).innerWidth()) {
					++change;
					w = $(this.settings.followElementWidth).innerWidth();
					this.element.outerWidth(w);
				}
			}

			if (this.settings.followElementHeight) {
				if (h != $(this.settings.followElementHeight).innerHeight()) {
					++change;
					var h = $(this.settings.followElementHeight).innerHeight();
					this.element.outerHeight(h);
				}
			}
		}

		if (this.settings.fillContainer) {
			var container = undefined;

			if (this.settings.fillContainer === 'parent') {
				container = this.element.parent();
			}
			else {
				container = $(this.settings.fillContainer);
			}

			if (w != container.innerWidth()) {
				++change;
				w = container.innerWidth();
				this.element.outerWidth(w);
			}
			if (h != container.innerHeight()) {
				++change;
				h = container.innerHeight();
				this.element.outerHeight(h);
			}
		}

		if (change || (w != this.lastWidth) || (h != this.lastHeight)) {
			//console.log(this.id + ' changed',w,h);
			this.element.find('.DigitopiaInstance').trigger('digitopiaContainerDidResize');
			$('.DigitopiaInstance').trigger('digitopiaContainerDidResize' + this.id);
			this.lastWidth = w;
			this.lastHeight = h;
		}
	};
};

$.fn.digitopiaContainer = GetJQueryPlugin('digitopiaContainer', digitopiaContainer);

export {
	digitopiaContainer
}
