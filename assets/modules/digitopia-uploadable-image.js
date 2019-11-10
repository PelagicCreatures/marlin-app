import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../modules/digitopia/js/controller.js';

function uploadableImage(elem) {
	this.element = $(elem);
	var self = this;

	this.columnName = this.element.data('column-name');
	this.maxHeight = this.element.data('max-height');
	this.maxWidth = this.element.data('max-width');
	this.input = $(this.element.data('target'));

	this.previewElement = $('[data-name="' + this.columnName + '-preview"]');
	this.widthElement = $('[data-name="' + this.columnName + '-width"]');
	this.heightElement = $('[data-name="' + this.columnName + '-height"]');

	this.start = function () {
		this.element.on('change', function (e) {
			self.processImage(e.target.files[0])
		});
	};

	this.stop = function () {
		this.element.off('change');
	};

	this.processImage = function (file) {
		var reader = new FileReader();
		reader.onload = function (readerEvent) {
			var image = new Image();
			image.onload = function (imageEvent) {
				var max_size = 300;
				var canvas = document.createElement('canvas');
				var w = image.width,
					h = image.height;
				if (w > h) {
					if (w > self.maxWidth) {
						h *= self.maxWidth / w;
						w = self.maxWidth;
					}
				}
				else {
					if (h > self.maxHeight) {
						w *= self.maxHeight / h;
						h = self.maxHeight;
					}
				}
				canvas.width = w;
				canvas.height = h;
				canvas.getContext('2d').drawImage(image, 0, 0, w, h);
				var dataURL = canvas.toDataURL("image/jpeg", 1.0);
				self.input.val(dataURL);

				self.widthElement.val(w);
				self.heightElement.val(h);
			}
			image.src = readerEvent.target.result;
			self.previewElement.empty().append('<img src="' + readerEvent.target.result + '">');
		}
		reader.readAsDataURL(file);
	}
}

$.fn.uploadableImage = GetJQueryPlugin('uploadableImage', uploadableImage);

export {
	uploadableImage
}
