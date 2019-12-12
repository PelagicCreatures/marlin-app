// digitopia/viewport.js - digitopia.js element position controller
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

var digitopiaViewport = function (element, options) {
	this.element = $(element);

	var self = this;

	this.element.css({
		'position': 'relative',
		'overflow': 'hidden'
	});

	this.settings = $.extend({
		crop: $(this.element).data('crop') ? $(this.element).data('crop') : false,
		align: $(this.element).data('align') ? $(this.element).data('align') : 'center',
		blowup: $(this.element).data('blowup') ? $(this.element).data('blowup') : false,
		trimHeight: $(this.element).data('trim-height') ? $(this.element).data('trim-height') : false,
		listenTo: $(this.element).data('listen-to') ? $(this.element).data('listen-to') : false,
	}, options || {});

	this.align = this.settings.align ? this.settings.align.split(',') : [];
	this.height = this.element.height();

	this.elements = $(this.element).children();
	for (var i = 0; i < this.elements.length; i++) {
		$(this.elements[i]).css({
			'position': 'absolute',
			'max-width': '10000px'
		});
		$(this.elements[i]).data('inViewPort', self);
	}

	this.start = function () {
		this.element.on('DigitopiaScaleChanged.' + this.id, function (e, scale) {
			e.stopPropagation();
			if (e.target === this) {
				if (!self.settings.trimHeight) {
					self.height = self.element.height();
				}
				self.fitElements(scale);
			}
		});

		if (!this.settings.listenTo) {
			this.element.on('DigitopiaDidResize.' + this.id, function (e) {
				e.stopPropagation();
				if (e.target === this) {
					self.fitElements();
				}
			});
		}
		else {
			var id = $(this.settings.listenTo).attr('id');
			this.element.on('digitopiaContainerDidResize' + id + '.' + this.id, function (e) {
				e.stopPropagation();
				if (e.target === this) {
					self.fitElements();
				}
			});
		}

		this.fitElements();
	};

	this.stop = function () {
		this.element.off('DigitopiaScaleChanged.' + this.id);
		if (!this.settings.listenTo) {
			this.element.off('DigitopiaDidResize.' + this.id);
		}
		else {
			var id = $(this.settings.listenTo).attr('id');
			this.element.off('digitopiaContainerDidResize' + id + '.' + this.id);
		}
	};

	this.getAlign = function (find) {
		this.align = this.settings.align ? this.settings.align.split(',') : [];
		for (var i = 0; i < this.align.length; i++) {
			if (this.align[i] === find) {
				return true;
			}
		}
		return false;
	}

	this.fitElements = function () {
		var maxHeight = 0;
		for (var i = 0; i < this.elements.length; i++) {
			var child = this.elements[i];

			var width = $(child).data('width');
			var height = $(child).data('height');

			var boxwidth = $(this.element).width();

			var boxheight = $(this.element).height();

			if (this.settings.trimHeight) {
				boxheight = this.height
			}

			//console.log('width,height,boxwidth,boxheight',width,height,boxwidth,boxheight);

			var imgRatio = (height / width);
			var boxRatio = (boxheight / boxwidth);
			var mult = 1;

			if (this.settings.crop) {
				if (imgRatio < boxRatio) {
					mult = boxheight / height;
				}
				else {
					mult = boxwidth / width;
				}
			}
			else {
				if (imgRatio > boxRatio) {
					mult = boxheight / height;
				}
				else {
					mult = boxwidth / width;
				}
			}

			width = width * mult;
			height = height * mult;

			if (!this.settings.blowup) {
				if ($(child).data('width') && width > $(child).data('width')) {
					width = $(child).data('width');
				}

				if ($(child).data('height') && height > $(child).data('height')) {
					height = $(child).data('height');
				}
			}

			if (this.settings.trimHeight) {
				$(this.element).height(height);
				boxheight = height;
			}

			var top = (boxheight - height) / 2;
			var left = (boxwidth - width) / 2;

			if (this.getAlign('top')) {
				top = 0;
			}

			if (this.getAlign('bottom')) {
				top = boxheight - height;
			}

			if (this.getAlign('left')) {
				left = 0;
			}

			if (this.getAlign('right')) {
				left = boxwidth - width;
			}

			var css = {
				'top': top + 'px',
				'left': left + 'px',
				'width': width + 'px',
				'height': height + 'px'
			}


			$(child).css(css);
		}
	};
};

$.fn.digitopiaViewport = GetJQueryPlugin('digitopiaViewport', digitopiaViewport);

export {
	digitopiaViewport
}
