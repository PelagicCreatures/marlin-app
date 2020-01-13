import $ from 'jquery'

import {
	Sargasso, registerSargassoClass
}
	from '@pelagiccreatures/sargasso'

import * as Utils from './utils'
import * as MDC from './MDC'

class ajaxButton extends Sargasso {
	constructor (elem, options) {
		super(elem, options)

		this.jqElement = $(elem)
		this.endpoint = this.jqElement.data('endpoint')
		this.redirect = this.jqElement.data('redirect') ? this.jqElement.data('redirect') : '/users/home'
		this.method = this.jqElement.data('method') ? this.jqElement.data('method') : 'POST'
		this.confirm = this.jqElement.data('confirm') ? this.jqElement.data('confirm') : false
		this.confirmPrompt = this.jqElement.data('confirm-prompt') ? this.jqElement.data('confirm-prompt') : 'Are you sure?'
	}

	start () {
		super.start()
		this.jqElement.on('click', (e) => {
			e.preventDefault()

			if (this.confirm) {
				const html = confirmDialogTemplate({
					title: 'Please Confirm',
					prompt: this.confirmPrompt
				})

				$('#ephemeral').append($(html))

				const dialog = MDC.MDCDialog.attachTo(document.querySelector(this.confirm))
				$(this.confirm).data('mdc-dialog', dialog)

				dialog.listen('MDCDialog:closed', (e) => {
					$('body').removeClass('modal-open')
					if (e.detail.action === 'accept') {
						this.doIt()
					}

					dialog.destroy()
					$('#ephemeral').empty()
				})
				$('body').addClass('modal-open')
				dialog.open()
			} else {
				this.doIt()
			}
		})
	};

	sleep () {
		this.jqElement.off('click')
	};

	doIt () {
		$.ajax({
			method: this.method,
			url: this.endpoint,
			headers: {
				'x-digitopia-hijax': 'true'
			}
		}).done((data, textStatus, jqXHR) => {
			var flashLevel = jqXHR.getResponseHeader('Sargasso-Flash-Level') ? jqXHR.getResponseHeader('Sargasso-Flash-Level') : data.flashLevel
			var flashMessage = jqXHR.getResponseHeader('Sargasso-Flash-Message') ? jqXHR.getResponseHeader('Sargasso-Flash-Message') : data.flashMessage
			var loggedIn = jqXHR.getResponseHeader('Sargasso-Did-Login') ? jqXHR.getResponseHeader('Sargasso-Did-Login') : data.didLogin
			var loggedOut = jqXHR.getResponseHeader('Sargasso-Did-Logout') ? jqXHR.getResponseHeader('Sargasso-Did-Logout') : data.didLogout

			if (loggedIn) {
				Utils.didLogIn()
			}

			if (loggedOut) {
				Utils.didLogOut()
			}

			if (data.status === 'ok') {
				Utils.flashAjaxStatus('success', flashMessage)
				if (this.redirect === location.pathname) {
					Utils.reloadPage()
				} else {
					Utils.loadPage(this.redirect)
				}
			} else {
				Utils.flashAjaxStatus(flashLevel, flashMessage)
			}
		}).fail((jqXHR, textStatus, errorThrown) => {
			var message = errorThrown
			if (jqXHR.responseJSON) {
				if (jqXHR.responseJSON.errors) {
					message = ''
					for (var i = 0; i < jqXHR.responseJSON.errors.length; i++) {
						if (message) {
							message += ', '
						}
						message += jqXHR.responseJSON.errors[i]
					}
				} else {
					message = jqXHR.responseJSON.status
				}
			}
			Utils.flashAjaxStatus('error', message)
		})
	};
};

registerSargassoClass('ajaxButton', ajaxButton)

export {
	ajaxButton
}
