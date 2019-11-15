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
	self.redirect = this.element.data('redirect');

	this.start = function () {
		this.element.on('click', '.add-button', function (e) {
			e.preventDefault();
			let target = $(this).data('target');
			if (target) {
				let belongsTo = $(this).data('belongs-to');
				let fk = $(this).data('fk');

				loadPage(self.mountpoint + '/' + target + '/create?fk=' + fk + '&belongs-to=' + belongsTo)

			}
			else {
				loadPage(self.mountpoint + '/' + self.model + '/create')
			}
		});

		this.element.on('click', '.edit-button', function (e) {
			e.preventDefault();
			loadPage(self.mountpoint + '/' + self.model + '/' + self.id + '/edit')
		});

		this.element.on('click', '.delete-button', function (e) {
			e.preventDefault();
			let endpoint = self.mountpoint + '/' + self.model + '/' + self.id;
			self.API('DELETE', endpoint);
		});

		this.element.on('click', '.search-button', function (e) {
			e.preventDefault();
			let q = $(this).closest('.form-group').find('input[name="q"]').val();
			let prop = $(this).closest('.form-group').find('select[name="property"]').val();
			if (q && prop) {
				loadPage(location.pathname + '?q=' + encodeURIComponent(q) + '&property=' + encodeURIComponent(prop));
			}
		});

		this.element.on('click', '#submitter', function (e) {
			e.preventDefault();
			let endpoint = self.mountpoint + '/' + self.model;
			if (self.id) {
				endpoint += '/' + self.id;
			}
			let method = self.id ? 'PUT' : 'POST';
			let data = self.element.find('form').serializeObject();

			// special case - serializeObject does not send false checkbox value but we need it for boolean switch
			let checkboxes = self.element.find('.mdc-switch__native-control');
			for (let i = 0; i < checkboxes.length; i++) {
				let cb = checkboxes[i];
				let n = $(cb).attr('name'); // field names are in the form table[column]
				let p = n.match(/\[([^\]]+)\]/); // column is in p[1]
				n = n.replace(p[0], '');
				data[n][p[1]] = $(cb).is(':checked'); // sets data.table.column to true or false
			}

			self.API(method, endpoint, data);
		});

		this.element.on('mouseenter', '.select-row', function (e) {
			$(this).closest('tr').addClass('hovering');
		});

		this.element.on('mouseleave', '.select-row', function (e) {
			$(this).closest('tr').removeClass('hovering');
		});

		this.element.on('click', '.select-row', function (e) {
			e.preventDefault();
			var id = parseInt($(this).data('row'));
			loadPage(self.mountpoint + '/' + self.model + '/' + id)
		});
	}

	this.stop = function () {
		this.element.off('click', '.flextable-row');
		this.element.off('click', '.add-button');
		this.element.off('click', '.edit-button');
		this.element.off('click', '.delete-button');
	}

	this.API = function (method, endpoint, data) {
		$.ajax({
				method: method,
				url: endpoint,
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify(data),
				headers: {
					'x-digitopia-hijax': 'true'
				}
			})
			.done(function (data, textStatus, jqXHR) {
				var flashLevel = jqXHR.getResponseHeader('x-digitopia-hijax-flash-level') ? jqXHR.getResponseHeader('x-digitopia-hijax-flash-level') : data.flashLevel;
				var flashMessage = jqXHR.getResponseHeader('x-digitopia-hijax-flash-message') ? jqXHR.getResponseHeader('x-digitopia-hijax-flash-message') : data.flashMessage;
				if (data.status === 'ok') {
					flashAjaxStatus('success', flashMessage);
					let redir = self.redirect;
					if (data.id) {
						redir += '/' + data.id
					}
					loadPage(redir);
				}
				else {
					console.log(data);
					self.element.find('.ajax-errors').html('<div class="ajax-message ajax-message-' + flashLevel + '"><i class="material-icons">info</i> ' + flashMessage + '</div>');
				}
			})
	}
}

$.fn.adminController = GetJQueryPlugin('adminController', adminController);

export {
	adminController
}
