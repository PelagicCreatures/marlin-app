import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../modules/digitopia/js/controller.js';

function logoutController(elem, options) {
	this.element = $(elem);

	this.start = function () {
		this.element.on('click', function (e) {
			e.preventDefault();
			$.get('/api/users/logout')
				.done(function () {
					flashAjaxStatus('info', 'logged out');
					didLogOut();
					loadPage('/');
				})
				.fail(function () {
					flashAjaxStatus('danger', 'problem logging out');
					didLogOut();
					loadPage('/');
				});
		});
	};

	this.stop = function () {
		this.element.off('click');
	};
}
$.fn.logoutController = GetJQueryPlugin('logoutController', logoutController);

export {
	logoutController
}
