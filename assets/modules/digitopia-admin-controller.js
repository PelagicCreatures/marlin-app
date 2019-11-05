import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../modules/digitopia/js/controller.js';

function adminController(elem, options) {
	this.element = $(elem);
	var self = this;

	self.mountpoint = this.element.data('mountpoint');
	self.model = this.element.data('model');
	self.id = this.element.data('id');

	this.start = function () {
		this.element.on('click', '.add-button', function (e) {
			e.preventDefault();
			loadPage(self.mountpoint + '/' + self.model + '/' + self.id + '/create')
		});

		this.element.on('click', '.edit-button', function (e) {
			e.preventDefault();
			loadPage(self.mountpoint + '/' + self.model + '/' + self.id + '/edit')
		});

		this.element.on('click', '.delete-button', function (e) {
			e.preventDefault();
			let endpoint = self.mountpoint + '/' + self.model + '/' + self.id;
			self.api('DELETE', endpoint);
		});

		this.element.on('click', '.flextable-row', function (e) {
			e.preventDefault();
			var id = parseInt($(this).find('.flextable-row-header').html());
			loadPage(self.mountpoint + '/' + self.model + '/' + id)
		});
	}

	this.stop = function () {
		this.element.off('click', '.flextable-row');
		this.element.off('click', '.add-button');
		this.element.off('click', '.edit-button');
		this.element.off('click', '.delete-button');
	}

	this.API = function (method, endpoint) {

	}
}

$.fn.adminController = GetJQueryPlugin('adminController', adminController);

export {
	adminController
}
