import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../modules/digitopia/js/controller.js';

import {
	Validator,
	getMessage
}
from '../../lib/validator-extensions.js';



/*
import _ from 'lodash';
const Validator = _.cloneDeep(require('validator'));



// validator extensions from sequelize
let extensions = {
	extend(name, fn) {
			this[name] = fn;
			return this;
		},
		notEmpty(str) {
			return !str.match(/^[\s\t\r\n]*$/);
		},
		len(str, min, max) {
			return this.isLength(str, min, max);
		},
		isUrl(str) {
			return this.isURL(str);
		},
		isIPv6(str) {
			return this.isIP(str, 6);
		},
		isIPv4(str) {
			return this.isIP(str, 4);
		},
		notIn(str, values) {
			return !this.isIn(str, values);
		},
		regex(str, pattern, modifiers) {
			str += '';
			if (Object.prototype.toString.call(pattern).slice(8, -1) !== 'RegExp') {
				pattern = new RegExp(pattern, modifiers);
			}
			return str.match(pattern);
		},
		notRegex(str, pattern, modifiers) {
			return !this.regex(str, pattern, modifiers);
		},
		isDecimal(str) {
			return str !== '' && !!str.match(/^(?:-?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][+-]?(?:[0-9]+))?$/);
		},
		min(str, val) {
			const number = parseFloat(str);
			return isNaN(number) || number >= val;
		},
		max(str, val) {
			const number = parseFloat(str);
			return isNaN(number) || number <= val;
		},
		not(str, pattern, modifiers) {
			return this.notRegex(str, pattern, modifiers);
		},
		contains(str, elem) {
			return !!elem && str.includes(elem);
		},
		notContains(str, elem) {
			return !this.contains(str, elem);
		},
		is(str, pattern, modifiers) {
			return this.regex(str, pattern, modifiers);
		},
		notNull(str) {
			return str !== null && str !== undefined;
		},
		isPassword(str) {
			return this.is(str, '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])', '')
		}
};

_.forEach(extensions, (extend, key) => {
	Validator[key] = extend;
});
*/

function formValidator(elem, options) {
	this.element = $(elem);
	this.valid = false;
	this.submitter = this.element.find(this.element.data('submitter'));
	this.uniqueDebounce = null;
	this.lookupDebounce = null;

	var self = this;

	this.start = function () {
		self.initInput(self.element);

		this.element.find('[data-autofocus="true"]').focus();

		self.element.on('change blur focus keyup input', ':input', function (e) {
			if ($(this).attr('name')) {
				$(this).data('touched', true);
				$(this).closest('.form-group').addClass('touched');
				var isDirty = $(this).data('last-value') !== getRealVal(this);
				$(this).data('dirty', isDirty);
				self.validate();
			}
		});

		self.validate();
	};

	this.stop = function () {
		this.element.off('focus keyup', ':input');
		this.element.off('change blur', ':input');
	};

	this.validate = function (cb) {
		var invalidFields = 0;
		var fields = self.element.find(':input');

		async.map(fields, self.validateField, function (err, allerrors) {
			for (var i = 0; i < fields.length; i++) {
				var input = $(fields[i]);
				var errors = allerrors[i];

				if (errors && errors.length) {
					++invalidFields;

					input.closest('.form-group').removeClass('input-ok');
					if (input.data('touched')) {
						input.closest('.form-group').addClass('input-error');
						input.closest('.mdc-text-field').addClass('mdc-text-field--invalid');
						input.closest('.form-group').find('.validation-help').html(errors.join(', '));
					}
				}
				else {
					input.closest('.form-group').removeClass('input-error');
					input.closest('.mdc-text-field').removeClass('mdc-text-field--invalid');
					input.closest('.form-group').addClass('input-ok');
					if (input.data('dirty')) {
						input.data('last-value', getRealVal(input));
						self.element.trigger('validchange', input);
					}
				}
			}

			if (invalidFields) {
				self.valid = false;
				$(self.submitter).prop('disabled', true).addClass('disabled');
			}
			else {
				self.valid = true;
				$(self.submitter).prop('disabled', false).removeClass('disabled');
			}

			if (cb) {
				cb(self.valid);
			}
		});
	};

	this.initInput = function (element) {
		element.find(':input').each(function () {
			var input = this;
			$(input).data('touched', false);
			$(input).data('dirty', false);
			$(input).data('last-value', getRealVal(input));
			$(input).data('original-value', getRealVal(input));
			if ($(input).data('checked')) {
				$(input).prop('checked', 'checked');
			}

			if ($(input).data('input-behavior')) {
				$(input).payment($(input).data('input-behavior'));
			}
		});
	};

	this.validateField = function (element, cb) {
		var input = $(element);

		var valid = true;
		var val = getRealVal(input);
		var errors = [];

		if (input.data('validate')) {

			var validations = input.data('validate');

			for (let test in validations) {
				let opts = validations[test];
				if (typeof opts === 'boolean') {
					// no options
					if (!Validator[test](val)) {
						errors.push(getMessage(test));
					}
				}
				else {
					let myopts = opts.slice();
					myopts.unshift(val);
					if (!Validator[test].apply(Validator, myopts)) {
						errors.push(getMessage(test, opts));
					}
				}
			}
		}

		if (input.data('match') && getRealVal(self.element.find(input.data('match'))) !== getRealVal(input)) {
			errors.push('Does not match');
		}

		if (input.data('unique-endpoint')) {
			if (!errors.length && val.length > 2 && input.data('last-val') !== val &&
				!self.uniqueDebounce) {
				return self.isUnique(input, cb);
			}
			else {
				if (val.length > 2 && input.data('last-unique')) {
					errors.push('Already exists');
				}
			}
		}

		if (input.data('lookup-endpoint')) {
			if (!val.length) {
				input.removeData('last-lookup');
			}
			if (!errors.length && val.length && input.data('last-val') !== val && !self.lookupDebounce) {
				return self.lookup(input, cb);
			}
			else {
				if (input.data('last-lookup') && !input.data('last-lookup').found.length) {
					errors.push('Not found');
				}
			}
		}

		cb(null, errors);
	};

	this.isValid = function (cb) {
		this.validate(cb);
	};

	this.isUnique = function (input, cb) {
		self.uniqueDebounce = setTimeout(function () {
			self.uniqueDebounce = undefined;
			var endpoint = input.data('unique-endpoint');
			input.data('last-val', getRealVal(input));
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
						input.data('last-unique', 1);
						cb(null, ['Already exists']);
					}
					else {
						input.removeData('last-unique');
						cb(null);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {});
		}, 500);
	};

	this.lookup = function (input, cb) {
		self.lookupDebounce = setTimeout(function () {
			self.lookupDebounce = undefined;
			var endpoint = input.data('lookup-endpoint');
			input.data('last-val', getRealVal(input));

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
					input.data('last-lookup', data);
					if (!data.found || !data.found.length) {
						cb(null, ['not found']);
					}
					else {
						cb(null);
					}
				})
				.fail(function (jqXHR, textStatus, errorThrown) {});
		}, 500);
	};
}

// utility to get value of fields with special handling for checkboxes
function getRealVal(elem) {
	var $input = $(elem);
	var value;
	if ($input.attr('type') === 'checkbox') {
		value = $input.is(':checked');
		if ($input.prop('value') && $input.is(':checked')) {
			value = $input.prop('value');
		}
	}
	else {
		value = $input.val();
	}
	return value;
}

$.fn.formValidator = GetJQueryPlugin('formValidator', formValidator);

export {
	formValidator
}
