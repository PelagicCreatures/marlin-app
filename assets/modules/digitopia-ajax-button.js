import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../modules/digitopia/js/controller.js';

function ajaxButton(elem, options) {
	this.element = $(elem);
	var self = this;
	self.endpoint = self.element.data('endpoint');
	self.redirect = self.element.data('redirect') ? self.element.data('redirect') : '/users/subscription';
	self.method = self.element.data('method') ? self.element.data('method') : 'POST';
	self.confirm = self.element.data('confirm') ? self.element.data('confirm') : false;
	self.confirmPrompt = self.element.data('confirm-prompt') ? self.element.data('confirm-prompt') : 'Are you sure?';
	self.start = function () {
		self.element.on('click', function (e) {
			e.preventDefault();

			if (self.confirm) {
				let html = confirmDialogTemplate({
					title: 'Please Confirm',
					prompt: self.confirmPrompt
				});

				$('#ephemeral').append($(html));

				let dialog = App.MDC.MDCDialog.attachTo(document.querySelector(self.confirm));
				$(self.confirm).data('mdc-dialog', dialog);

				dialog.listen('MDCDialog:closed', function (e) {
					$('body').removeClass('modal-open');
					if (e.detail.action === 'accept') {
						self.doIt();
					}

					dialog.destroy();
					$('#ephemeral').empty();
				});
				$('body').addClass('modal-open');
				dialog.open();
			}
			else {
				self.doIt();
			}
		});
	};

	self.stop = function () {
		self.element.off('click');
	};

	self.doIt = function () {
		$.ajax({
				'method': self.method,
				'url': self.endpoint,
				'headers': {
					'x-digitopia-hijax': 'true'
				}
			})
			.done(function (data, textStatus, jqXHR) {
				var flashLevel = jqXHR.getResponseHeader('x-digitopia-hijax-flash-level') ? jqXHR.getResponseHeader('x-digitopia-hijax-flash-level') : data.flashLevel;
				var flashMessage = jqXHR.getResponseHeader('x-digitopia-hijax-flash-message') ? jqXHR.getResponseHeader('x-digitopia-hijax-flash-message') : data.flashMessage;

				if (data.status === 'ok') {
					flashAjaxStatus('success', flashMessage);
					if (self.redirect === location.pathname) {
						reloadPage();
					}
					else {
						loadPage(self.redirect);
					}
				}
				else {
					flashAjaxStatus(flashLevel, flashMessage);
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
							message += jqXHR.responseJSON.errors[i].msg;
						}
					}
					else {
						message = jqXHR.responseJSON.status;
					}
				}
				flashAjaxStatus('error', message);
			});
	};
};

$.fn.ajaxButton = GetJQueryPlugin('ajaxButton', ajaxButton);

export {
	ajaxButton
}
