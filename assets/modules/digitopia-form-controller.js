import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../modules/digitopia/js/controller.js';

function formController(elem, options) {
	this.element = $(elem);
	var self = this;

	self.endpoint = self.element.attr('action');
	self.redirect = self.element.data('redirect') ? self.element.data('redirect') : '/users/home';
	self.method = self.element.attr('method') ? self.element.attr('method') : 'POST';
	self.stayOnPage = self.element.data('stay-on-page') ? true : false;
	self.submitter = this.element.find(this.element.data('submitter'));

	this.start = function () {
		self.element.on('submit', function (e) {
			e.preventDefault();
			self.submitter.attr("disabled", true);
			let data = self.element.serializeObject();
			if (appOptions.RECAPTCHA_PUBLIC) {
				grecaptcha.execute(appOptions.RECAPTCHA_PUBLIC, {
					action: 'social'
				}).then(function (token) {
					data['g-recaptcha-response'] = token;
					self.submit(data)
				});
			}
			else {
				self.submit(data)
			}
		})
	}

	self.submit = function (data) {
		$.ajax({
				'method': self.method,
				'url': self.endpoint,
				'data': data,
				'headers': {
					'x-digitopia-hijax': 'true'
				}
			})
			.done(function (data, textStatus, jqXHR) {
				var flashLevel = jqXHR.getResponseHeader('x-digitopia-hijax-flash-level') ? jqXHR.getResponseHeader('x-digitopia-hijax-flash-level') : data.flashLevel;
				var flashMessage = jqXHR.getResponseHeader('x-digitopia-hijax-flash-message') ? jqXHR.getResponseHeader('x-digitopia-hijax-flash-message') : data.flashMessage;
				var redirect = jqXHR.getResponseHeader('x-digitopia-hijax-location') ? jqXHR.getResponseHeader('x-digitopia-hijax-location') : data.hijaxLocation;
				var loggedIn = jqXHR.getResponseHeader('x-digitopia-hijax-did-login') ? jqXHR.getResponseHeader('x-digitopia-hijax-did-login') : data.didLogin;
				var loggedOut = jqXHR.getResponseHeader('x-digitopia-hijax-did-logout') ? jqXHR.getResponseHeader('x-digitopia-hijax-did-logout') : data.didLogout;

				if (loggedIn) {
					didLogIn();
				}

				if (loggedOut) {
					didLogOut();
				}

				if (data.status === 'ok') {
					flashAjaxStatus('success', flashMessage);
					if (!self.stayOnPage) {
						loadPage(self.redirect);
					}
					else {
						self.element.find('.ajax-errors').html('<div class="ajax-message ajax-message-' + flashLevel + '"><i class="material-icons">info</i> ' + flashMessage + '</div>');
					}
				}
				else {
					self.element.find('.ajax-errors').html('<div class="ajax-message ajax-message-' + flashLevel + '"><i class="material-icons">info</i> ' + flashMessage + '</div>');
					self.submitter.attr("disabled", false);
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
				self.element.find('.ajax-errors').html('<div class="ajax-message ajax-message-error"><i class="material-icons">error</i> ' + message + '</div>');
				self.submitter.attr("disabled", false);
			});
	};

	this.stop = function () {
		self.element.off('submit');
	};
}

$.fn.formController = GetJQueryPlugin('formController', formController);

export {
	formController
}
