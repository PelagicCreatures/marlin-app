import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../../digitopia/js/controller.js';

import * as Utils from './utils';

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
			self.pleaseWait(true);
			let data = self.element.serializeObject();
			data['_csrf'] = self.element.find('[name="_csrf"]').val();
			if (publicOptions.RECAPTCHA_PUBLIC) {
				grecaptcha.execute(publicOptions.RECAPTCHA_PUBLIC, {
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
				method: self.method,
				url: self.endpoint,
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
				var loggedIn = jqXHR.getResponseHeader('x-digitopia-hijax-did-login') ? jqXHR.getResponseHeader('x-digitopia-hijax-did-login') : data.didLogin;
				var loggedOut = jqXHR.getResponseHeader('x-digitopia-hijax-did-logout') ? jqXHR.getResponseHeader('x-digitopia-hijax-did-logout') : data.didLogout;

				if (loggedIn) {
					didLogIn();
				}

				if (loggedOut) {
					didLogOut();
				}

				if (data.status === 'ok') {
					Utils.flashAjaxStatus('success', flashMessage);
					if (!self.stayOnPage) {
						Utils.loadPage(self.redirect);
					}
					else {
						self.element.find('.ajax-errors').html('<div class="ajax-message ajax-message-' + flashLevel + '"><i class="material-icons">info</i> ' + flashMessage + '</div>');
					}
				}
				else {
					self.element.find('.ajax-errors').html('<div class="ajax-message ajax-message-' + flashLevel + '"><i class="material-icons">info</i> ' + flashMessage + '</div>');
					self.pleaseWait(false);
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
							message += jqXHR.responseJSON.errors[i];
						}
					}
					else {
						message = jqXHR.responseJSON.status;
					}
				}
				self.element.find('.ajax-errors').html('<div class="ajax-message ajax-message-error"><i class="material-icons">error</i> ' + message + '</div>');
				self.pleaseWait(false);
			});
	};

	this.stop = function () {
		self.element.off('submit');
	};

	this.pleaseWait = function (on) {
		if (on) {
			var element = $(self.submitter);
			element.data('orig-html', element.html());
			var w = element.width();
			element.width(w);

			element.html('<i class="fas fa-circle-notch fa-spin"></i>');
		}
		else {
			self.submitter.attr("disabled", false);
			var element = $(self.submitter);
			$(element).html($(element).data('orig-html'));
		}
	}
}

$.fn.formController = GetJQueryPlugin('formController', formController);

export {
	formController
}
