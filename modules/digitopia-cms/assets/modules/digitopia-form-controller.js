import $ from 'jquery'

import {
	Reagent, registerReagentClass
}
	from '../../../reagent/lib/Reagent'

import * as Utils from './utils'

class formController extends Reagent {
	constructor (elem, options) {
		super(elem, options)
		this.jqElement = $(this.element)
		this.endpoint = this.jqElement.attr('action')
		this.redirect = this.jqElement.data('redirect') ? this.jqElement.data('redirect') : '/users/home'
		this.method = this.jqElement.attr('method') ? this.jqElement.attr('method') : 'POST'
		this.stayOnPage = !!this.jqElement.data('stay-on-page')
		this.submitter = this.jqElement.find(this.jqElement.data('submitter'))
		this.recaptcha = !!this.jqElement.data('recaptcha')
	}

	start () {
		super.start()

		if (this.recaptcha) {
			$('body').addClass('show-recaptcha-badge')
		}
		this.jqElement.on('submit', (e) => {
			e.preventDefault()
			this.pleaseWait(true)
			const data = this.jqElement.serializeObject()
			data._csrf = this.jqElement.find('[name="_csrf"]').val()
			if (this.recaptcha && publicOptions.RECAPTCHA_PUBLIC) {
				grecaptcha.execute(publicOptions.RECAPTCHA_PUBLIC, {
					action: 'social'
				}).then((token) => {
					data['g-recaptcha-response'] = token
					this.submit(data)
				})
			} else {
				this.submit(data)
			}
		})
	}

	submit (data) {
		$.ajax({
			method: this.method,
			url: this.endpoint,
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(data),
			headers: {
				'x-digitopia-hijax': 'true'
			}
		})
			.done((data, textStatus, jqXHR) => {
				var flashLevel = jqXHR.getResponseHeader('x-digitopia-hijax-flash-level') ? jqXHR.getResponseHeader('x-digitopia-hijax-flash-level') : data.flashLevel
				var flashMessage = jqXHR.getResponseHeader('x-digitopia-hijax-flash-message') ? jqXHR.getResponseHeader('x-digitopia-hijax-flash-message') : data.flashMessage
				var loggedIn = jqXHR.getResponseHeader('x-digitopia-hijax-did-login') ? jqXHR.getResponseHeader('x-digitopia-hijax-did-login') : data.didLogin
				var loggedOut = jqXHR.getResponseHeader('x-digitopia-hijax-did-logout') ? jqXHR.getResponseHeader('x-digitopia-hijax-did-logout') : data.didLogout

				if (loggedIn) {
					Utils.didLogIn()
				}

				if (loggedOut) {
					Utils.didLogOut()
				}

				if (data.status === 'ok') {
					Utils.flashAjaxStatus('success', flashMessage)
					if (!this.stayOnPage) {
						Utils.loadPage(this.redirect)
					} else {
						this.jqElement.find('.ajax-errors').html('<div class="ajax-message ajax-message-' + flashLevel + '"><i class="material-icons">info</i> ' + flashMessage + '</div>')
						this.pleaseWait(false)
					}
				} else {
					this.jqElement.find('.ajax-errors').html('<div class="ajax-message ajax-message-' + flashLevel + '"><i class="material-icons">info</i> ' + flashMessage + '</div>')
					this.pleaseWait(false)
				}
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
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
				this.jqElement.find('.ajax-errors').html('<div class="ajax-message ajax-message-error"><i class="material-icons">error</i> ' + message + '</div>')
				this.pleaseWait(false)
			})
	}

	sleep () {
		if (this.recaptcha) {
			$('body').removeClass('show-recaptcha-badge')
		}
		this.jqElement.off('submit')
		super.sleep()
	}

	pleaseWait (on) {
		if (on) {
			var element = $(this.submitter)
			element.data('orig-html', element.html())
			var w = element.width()
			element.width(w)

			element.html('<i class="fas fa-circle-notch fa-spin"></i>')
		} else {
			this.submitter.attr('disabled', false)
			var e = $(this.submitter)
			$(e).html($(element).data('orig-html'))
		}
	}
}

registerReagentClass('formController', formController)

export {
	formController
}
