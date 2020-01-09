import $ from 'jquery'

import {
	Reagent, registerReagentClass
}
	from '@antisocialnet/reagent'

import {
	Validator,
	getMessage
}
	from '../../lib/validator-extensions.js'

import async from 'async'

class formValidator extends Reagent {
	constructor (elem, options) {
		super(elem, options)
		this.jqElement = $(this.element)
		this.valid = false
		this.submitter = this.jqElement.find(this.jqElement.data('submitter'))
		this.uniqueDebounce = null
		this.lookupDebounce = null
		this.dirty = false
	}

	start () {
		super.start()

		var self = this

		this.initInput(this.jqElement)

		this.jqElement.find('[data-autofocus="true"]').focus()

		this.jqElement.on('change blur focus keyup input', ':input', function (e) {
			self.dirty = true

			if ($(this).attr('name')) {
				$(this).data('touched', true)
				$(this).closest('.form-group').addClass('touched')
				var isDirty = $(this).data('last-value') !== getRealVal(this)
				$(this).data('dirty', isDirty)
				self.validate()
			}
		})

		this.validate()
	};

	sleep () {
		this.jqElement.off('focus keyup', ':input')
		this.jqElement.off('change blur', ':input')
		super.sleep()
	};

	validate (cb) {
		var invalidFields = 0
		var fields = this.jqElement.find('[data-validate]:input')

		async.map(fields, this.validateField.bind(this), (err, allerrors) => {
			if (err) {
				//
			}
			for (var i = 0; i < fields.length; i++) {
				var input = $(fields[i])
				var errors = allerrors[i]

				if (errors && errors.length) {
					++invalidFields
					// console.log(input.attr('name') + ' ' + errors.join(', '));
					input.closest('.form-group').removeClass('input-ok')
					if (input.data('touched')) {
						input.closest('.form-group').addClass('input-error')
						input.closest('.mdc-text-field').addClass('mdc-text-field--invalid')
						input.closest('.form-group').find('.validation-help').html(errors.join(', '))
					}
				} else {
					// console.log(input.attr('name') + ' ok');
					input.closest('.form-group').removeClass('input-error')
					input.closest('.mdc-text-field').removeClass('mdc-text-field--invalid')
					input.closest('.form-group').addClass('input-ok')
					if (input.data('dirty')) {
						input.data('last-value', getRealVal(input))
						this.jqElement.trigger('validchange', input)
					}
				}
			}

			if (invalidFields) {
				this.valid = false
				$(this.submitter).prop('disabled', true).addClass('disabled')
			} else {
				this.valid = true
				if (this.dirty) {
					$(this.submitter).prop('disabled', false).removeClass('disabled')
				}
			}

			if (cb) {
				cb(this.valid)
			}
		})
	};

	initInput (element) {
		element.find(':input').each(function () {
			var input = this
			$(input).data('touched', false)
			$(input).data('dirty', false)
			$(input).data('last-value', getRealVal(input))
			$(input).data('original-value', getRealVal(input))
			if ($(input).data('checked')) {
				$(input).prop('checked', 'checked')
			}

			if ($(input).data('input-behavior')) {
				$(input).payment($(input).data('input-behavior'))
			}
		})
	};

	validateField (element, cb) {
		var input = $(element)

		var val = getRealVal(input)
		var errors = []

		if (input.data('validate')) {
			var validations = input.data('validate')

			// if we allow null and it is null, skip all other validation
			if (!validations.notEmpty && !val) {
				return cb(null, errors)
			}

			for (const test in validations) {
				const opts = validations[test]
				if (typeof opts === 'boolean') {
					// no options
					if (!Validator[test](val)) {
						errors.push(getMessage(test))
					}
				} else {
					const myopts = opts.slice()
					myopts.unshift(val)
					if (!Validator[test].apply(Validator, myopts)) {
						errors.push(getMessage(test, opts))
					}
				}
			}
		}

		if (input.data('match') && getRealVal(this.jqElement.find(input.data('match'))) !== getRealVal(input)) {
			errors.push('Does not match')
		}

		if (input.data('unique-endpoint')) {
			if (!errors.length && val.length > 2 && input.data('last-val') !== val &&
				!this.uniqueDebounce) {
				return this.isUnique(input, cb)
			} else {
				if (val.length > 2 && input.data('last-unique')) {
					errors.push('Already exists')
				}
			}
		}

		if (input.data('lookup-endpoint')) {
			if (!val.length) {
				input.removeData('last-lookup')
			}
			if (!errors.length && val.length && input.data('last-val') !== val && !this.lookupDebounce) {
				return this.lookup(input, cb)
			} else {
				if (input.data('last-lookup') && !input.data('last-lookup').found.length) {
					errors.push('Not found')
				}
			}
		}

		cb(null, errors)
	};

	isValid (cb) {
		this.validate(cb)
	};

	isUnique (input, cb) {
		this.uniqueDebounce = setTimeout(() => {
			this.uniqueDebounce = undefined
			var endpoint = input.data('unique-endpoint')
			input.data('last-val', getRealVal(input))
			$.ajax({
				method: 'POST',
				url: endpoint,
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify({
					value: getRealVal(input)
				}),
				headers: {
					'x-digitopia-hijax': 'true'
				}
			})
				.done(function (data, textStatus, jqXHR) {
					if (data.found) {
						input.data('last-unique', 1)
						cb(null, ['Already exists'])
					} else {
						input.removeData('last-unique')
						cb(null)
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {})
		}, 500)
	};

	lookup (input, cb) {
		this.lookupDebounce = setTimeout(function () {
			this.lookupDebounce = undefined
			var endpoint = input.data('lookup-endpoint')
			input.data('last-val', getRealVal(input))

			$.ajax({
				method: 'POST',
				url: endpoint,
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify({
					value: getRealVal(input)
				}),
				headers: {
					'x-digitopia-hijax': 'true'
				}
			})
				.done((data, textStatus, jqXHR) => {
					input.data('last-lookup', data)
					if (!data.found || !data.found.length) {
						cb(null, ['not found'])
					} else {
						cb(null)
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {})
		}, 500)
	};
}

// utility to get value of fields with special handling for checkboxes
function getRealVal (elem) {
	var $input = $(elem)
	var value
	if ($input.attr('type') === 'checkbox') {
		value = $input.is(':checked')
		if ($input.prop('value') && $input.is(':checked')) {
			value = $input.prop('value')
		}
	} else {
		value = $input.val()
	}
	return value
}

registerReagentClass('formValidator', formValidator)

export {
	formValidator
}
