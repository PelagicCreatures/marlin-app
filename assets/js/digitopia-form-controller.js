(function ($) {
	function formController(elem, options) {
		this.element = $(elem);
		var self = this;

		self.endpoint = self.element.attr('action');

		self.method = self.element.attr('method') ? self.element.attr('method') : 'POST';

		this.start = function () {
			self.element.on('submit', function (e) {
				e.preventDefault();
				var data = self.element.serializeObject();
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
							loadPage('/users/home');
						}
						else {
							self.element.find('.ajax-errors').html('<div class="ajax-message ajax-message-' + flashLevel + '"><i class="material-icons">info</i> ' + flashMessage + '</div>');
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
					});
			})
		};

		this.stop = function () {
			self.element.off('submit');
		};
	}

	$.fn.formController = GetJQueryPlugin('formController', formController);

})(jQuery);
