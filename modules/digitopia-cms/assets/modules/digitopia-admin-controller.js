import $ from 'jquery'

import {
	Sargasso, registerSargassoClass
}
	from '@pelagiccreatures/sargasso'

import * as Utils from './utils'
import * as MDC from './MDC'

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

			const html = confirmDialogTemplate({
				title: 'Please Confirm',
				prompt: 'Delete this row?'
			})

			$('#ephemeral').append($(html))

			const dialog = MDC.MDCDialog.attachTo(document.querySelector('#confirm-dialog'))
			$('#confirm-dialog').data('mdc-dialog', dialog)

			dialog.listen('MDCDialog:closed', function (e) {
				$('body').removeClass('modal-open')
				if (e.detail.action === 'accept') {
					const endpoint = self.mountpoint + '/' + self.model + '/' + self.id
					self.API('DELETE', endpoint)
				}

				dialog.destroy()
				$('#ephemeral').empty()
			})

			$('body').addClass('modal-open')
			dialog.open()
		})

		this.jqElement.on('click', '.search-button', function (e) {
			e.preventDefault()
			const q = $(this).closest('.form-group').find('input[name="q"]').val()
			const prop = $(this).closest('.form-group').find('select[name="property"]').val()
			if (q && prop) {
				Utils.loadPage(location.pathname + '?q=' + encodeURIComponent(q) + '&property=' + encodeURIComponent(prop))
			}
		})

		this.jqElement.on('click', '#submitter', function (e) {
			e.preventDefault()
			let endpoint = self.mountpoint + '/' + self.model
			if (self.id) {
				endpoint += '/' + self.id
			}
			const method = self.id ? 'PUT' : 'POST'
			const data = self.jqElement.find('form').serializeObject()

			// special case - serializeObject does not send false checkbox value but we need it for boolean switch
			const checkboxes = self.jqElement.find('.mdc-switch__native-control')
			for (let i = 0; i < checkboxes.length; i++) {
				const cb = checkboxes[i]
				let n = $(cb).attr('name') // field names are in the form table[column]
				const p = n.match(/\[([^\]]+)\]/) // column is in p[1]
				n = n.replace(p[0], '')
				data[n][p[1]] = $(cb).is(':checked') // sets data.table.column to true or false
			}

			data._csrf = self.jqElement.find('[name="_csrf"]').val()

			self.API(method, endpoint, data)
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

		this.jqElement.on('MDCChip:selection', '.mdc-chip', function (e) {
			const selected = []
			$(this).closest('.mdc-chip-set').find('.mdc-chip--selected').each(function () {
				selected.push($(this).data('id'))
			})
			$(this).closest('.mdc-chip-set').find('input').val(selected.join(',')).trigger('change')
		})
	}

	sleep () {
		this.jqElement.off('click', '.flextable-row')
		this.jqElement.off('click', '.add-button')
		this.jqElement.off('click', '.edit-button')
		this.jqElement.off('click', '.delete-button')
		this.jqElement.off('click', '.search-button')
		this.jqElement.off('click', '#submitter')
		this.jqElement.off('mouseenter', '.select-row')
		this.jqElement.off('mouseleave', '.select-row')
		this.jqElement.off('click', '.select-row')
		this.jqElement.off('MDCChip:selection', '.mdc-chip')
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

registerSargassoClass('adminController', adminController)

export {
	adminController
}
