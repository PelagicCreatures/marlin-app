import {
	tropicBird, didLogIn, didLogOut
}
	from './utils.js'

import {
	utils
}
	from '@pelagiccreatures/sargasso'

import {
	MolaMolaHelper, molaMolaUtils
}
	from '@pelagiccreatures/molamola'

class AdminHandler extends MolaMolaHelper {
	pose () {
		this.chipHandler = function (e) {
			if (e.target === this) {
				const selected = []
				const sel = this.closest('.mdc-chip-set').querySelectorAll('.mdc-chip--selected')
				Array.from(sel).forEach(function (chip) {
					selected.push(chip.getAttribute('data-id'))
				})
				this.closest('.mdc-chip-set').querySelector('input').value = selected.join(',')
			}
		}

		const chips = this.form.element.getElementsByClassName('mdc-chip')
		Array.from(chips).forEach((chip) => {
			chip.addEventListener('MDCChip:selection', this.chipHandler, false)
		})
	}

	preFlight () {
		// special case - always send checkbox value for boolean switch
		const checkboxes = this.form.element.getElementsByClassName('mdc-switch__native-control')
		for (let i = 0; i < checkboxes.length; i++) {
			const cb = checkboxes[i]
			this.form.payload[cb.getAttribute('name')] = !!cb.checked // sets data.table.column to true or false
		}

		const json = {}
		for (const k in this.form.payload) {
			const tableColumn = k.match(/^([^\[]+)\[([^\]]+)\]/)
			if (!tableColumn) {
				json[k] = this.form.payload[k]
			} else {
				if (!json[tableColumn[1]]) {
					json[tableColumn[1]] = {}
				}
				json[tableColumn[1]][tableColumn[2]] = this.form.payload[k]
			}
		}
		this.form.payload = json
	}

	destroy () {
		const chips = this.form.element.getElementsByClassName('mdc-chip')
		Array.from(chips).forEach((chip) => {
			chip.removeEventListener('MDCChip:selection', this.chipHandler)
		})
		super.destroy()
	}
}

molaMolaUtils.registerHelperClass('AdminHandler', AdminHandler)

class BoilerplateHandler extends MolaMolaHelper {
	// TODO MDC TextInput floating label borked on autofill, revisit once they fix it
	pose () {
		setTimeout(() => {
			const borked = document.querySelectorAll('input:-webkit-autofill')
			if (borked && borked.length) {
				Array.from(borked).forEach((element) => {
					const mdcElement = element.closest('.mdc-text-field')
					if (mdcElement) {
						const textField = utils.elementTools.getMetaData(mdcElement, 'MDCTextField')
						if (textField) {
							textField.getLabelAdapterMethods_().floatLabel(true)
						}
					}
				})
			}
		}, 500)
	}

	success (data) {
		if (data.didLogin) {
			didLogIn()
			if (!data.redirect) {
				data.redirect = '/users/home'
			}
		}
		if (data.didLogout) {
			didLogOut()
			if (!data.redirect) {
				data.redirect = '/users/login'
			}
		}
		if (data.message) {
			tropicBird.pushSnackBar('info', data.message)
		}
		if (data.errors) {
			for (let i = 0; i < data.errors.length; i++) {
				tropicBird.pushSnackBar(data['error-level'] || 'info', data.errors[i])
			}
		}

		if (!data.redirect && this.form.element.getAttribute('data-redirect')) {
			data.redirect = this.form.element.getAttribute('data-redirect')
		}

		if (data.status === 'ok' && data.redirect) {
			App.Utils.loadPage(data.redirect)
		}
	}

	error (err) {
		tropicBird.pushSnackBar('error', err.message)
	}
}

molaMolaUtils.registerHelperClass('BoilerplateHandler', BoilerplateHandler)
