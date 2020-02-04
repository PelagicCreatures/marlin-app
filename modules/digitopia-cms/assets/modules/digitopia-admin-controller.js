import $ from 'jquery'

import {
	Sargasso, utils
}
	from '@pelagiccreatures/sargasso'

import * as Utils from './utils'

class adminController extends Sargasso {
	constructor (elem, options) {
		super(elem, options)
		this.jqElement = $(elem)
		this.mountpoint = this.jqElement.data('mountpoint')
		this.model = this.jqElement.data('model')
		this.id = this.jqElement.data('id')
		this.redirect = this.jqElement.data('redirect')
	}

	start () {
		super.start()

		const self = this

		this.jqElement.on('click', '.add-button', function (e) {
			e.preventDefault()
			const target = $(this).data('target')
			if (target) {
				const belongsTo = $(this).data('belongs-to')
				const fk = $(this).data('fk')
				Utils.loadPage(self.mountpoint + '/' + target + '/create?fk=' + fk + '&belongs-to=' + belongsTo)
			} else {
				Utils.loadPage(self.mountpoint + '/' + self.model + '/create')
			}
		})

		this.jqElement.on('click', '.edit-button', function (e) {
			e.preventDefault()
			Utils.loadPage(self.mountpoint + '/' + self.model + '/' + self.id + '/edit')
		})

		this.jqElement.on('click', '.delete-button', function (e) {
			e.preventDefault()
			Utils.tropicBird.dialog('#confirm-dialog', 'Delete this row?', this.confirmPrompt, true).then((action) => {
				if (action === 'accept') {
					const endpoint = self.mountpoint + '/' + self.model + '/' + self.id
					self.API('DELETE', endpoint)
				}
			})
		})

		this.jqElement.on('click', '.search-button', function (e) {
			e.preventDefault()
			const q = $(this).closest('.input-group').find('input[name="q"]').val()
			const prop = $(this).closest('.input-group').find('select[name="property"]').val()
			if (q && prop) {
				Utils.loadPage(location.pathname + '?q=' + encodeURIComponent(q) + '&property=' + encodeURIComponent(prop))
			}
		})

		this.jqElement.on('mouseenter', '.select-row', function (e) {
			$(this).closest('tr').addClass('hovering')
		})

		this.jqElement.on('mouseleave', '.select-row', function (e) {
			$(this).closest('tr').removeClass('hovering')
		})

		this.jqElement.on('click', '.select-row', function (e) {
			e.preventDefault()
			var id = parseInt($(this).data('row'))
			Utils.loadPage(self.mountpoint + '/' + self.model + '/' + id)
		})
	}

	sleep () {
		this.jqElement.off('click', '.flextable-row')
		this.jqElement.off('click', '.add-button')
		this.jqElement.off('click', '.edit-button')
		this.jqElement.off('click', '.delete-button')
		this.jqElement.off('click', '.search-button')
		this.jqElement.off('mouseenter', '.select-row')
		this.jqElement.off('mouseleave', '.select-row')
		this.jqElement.off('click', '.select-row')
		super.sleep()
	}

	API (method, endpoint, data) {
		const self = this
		$.ajax({
			method: method,
			url: endpoint,
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(data),
			headers: {
				'x-digitopia-hijax': 'true'
			}
		}).done(function (data, textStatus, jqXHR) {
			var flashLevel = jqXHR.getResponseHeader('Sargasso-Flash-Level') ? jqXHR.getResponseHeader('Sargasso-Flash-Level') : data.flashLevel
			var flashMessage = jqXHR.getResponseHeader('Sargasso-Flash-Message') ? jqXHR.getResponseHeader('Sargasso-Flash-Message') : data.flashMessage
			if (data.status === 'ok') {
				Utils.flashAjaxStatus('success', flashMessage)
				let redir = self.redirect
				if (data.id && !redir.match(/\/\d+$/)) {
					redir += '/' + data.id
				}
				Utils.loadPage(redir)
			} else {
				console.log(data)
				self.jqElement.find('.ajax-errors').html('<div class="ajax-message ajax-message-' + flashLevel + '"><i class="material-icons">info</i> ' + flashMessage + '</div>')
			}
		}).fail(function (jqXHR, textStatus, errorThrown) {
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
			self.jqElement.find('.ajax-errors').html('<div class="ajax-message ajax-message-error"><i class="material-icons">error</i> ' + message + '</div>')
		})
	}
}

utils.registerSargassoClass('adminController', adminController)

export {
	adminController
}
