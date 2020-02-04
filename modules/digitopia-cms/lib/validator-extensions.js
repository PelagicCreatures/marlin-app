const _ = require('lodash')
const Validator = _.cloneDeep(require('validator'))

// validator extensions from sequelize
const extensions = {
	extend (name, fn) {
		this[name] = fn
		return this
	},
	notEmpty (str) {
		return !str.match(/^[\s\t\r\n]*$/)
	},
	len (str, min, max) {
		return this.isLength(str, min, max)
	},
	isUrl (str) {
		return this.isURL(str)
	},
	isIPv6 (str) {
		return this.isIP(str, 6)
	},
	isIPv4 (str) {
		return this.isIP(str, 4)
	},
	notIn (str, values) {
		return !this.isIn(str, values)
	},
	regex (str, pattern, modifiers) {
		str += ''
		if (Object.prototype.toString.call(pattern).slice(8, -1) !== 'RegExp') {
			pattern = new RegExp(pattern, modifiers)
		}
		return str.match(pattern)
	},
	notRegex (str, pattern, modifiers) {
		return !this.regex(str, pattern, modifiers)
	},
	isDecimal (str) {
		return str !== '' && !!str.match(/^(?:-?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][+-]?(?:[0-9]+))?$/)
	},
	min (str, val) {
		const number = parseFloat(str)
		return isNaN(number) || number >= val
	},
	max (str, val) {
		const number = parseFloat(str)
		return isNaN(number) || number <= val
	},
	not (str, pattern, modifiers) {
		return this.notRegex(str, pattern, modifiers)
	},
	contains (str, elem) {
		return !!elem && str.includes(elem)
	},
	notContains (str, elem) {
		return !this.contains(str, elem)
	},
	is (str, pattern, modifiers) {
		return this.regex(str, pattern, modifiers)
	},
	notNull (str) {
		return str !== null && str !== undefined
	},
	isPassword (str) {
		return this.notEmpty(str) && this.len(str, 8, 20) && this.is(str, '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])', '')
	},
	notHTML (str) {
		return !str.match(/<\s*[^>]*>(.*?)<\s*\/[^>]*>/) && !str.match(/<[^>]*>/)
	}
}

_.forEach(extensions, (extend, key) => {
	Validator[key] = extend
})

const messages = {
	len: 'Length between %s and %s',
	notEmpty: 'Required',
	isEmail: 'Not an email address',
	isPassword: 'At least one uppercase, one lowercase and one number'
}

function getMessage (test, opts) {
	let message = messages[test]
	if (!messages[test]) {
		message = test
		if (opts) {
			for (let i = 0; i < opts.length; i++) {
				message += ' %s'
			}
		}
	}
	if (!opts) {
		return message
	}
	let c = 0
	return message.replace(/\%s/g, function () {
		const opt = opts[c++]
		return opt ? opt.toString() : ''
	})
}

function sanitizePayload (payload, sanitizers, options) {
	const sanitized = {}
	const warnings = []

	for (const prop in payload) {
		sanitized[prop] = payload[prop]
		if (sanitizers[prop]) {
			for (const test in sanitizers[prop]) {
				if (test === 'xss') {
					sanitized[prop] = sanitized[prop].replace(/<\s*[^>]*>(.*?)<\s*\/[^>]*>/g, '[markup removed]')
					sanitized[prop] = sanitized[prop].replace(/<[^>]*>/g, '[markup removed]')
					// sanitized[prop] = sanitized[prop].replace(/&lt;/gi, '〈');
					// sanitized[prop] = sanitized[prop].replace(/&gt;/gi, '〉');
					if (sanitized[prop] !== payload[prop]) {
						warnings.push({
							[prop]: 'xss: removed markup'
						})
					}
				}
			}
		}
	}

	return {
		values: sanitized,
		warnings: warnings
	}
}

function validatePayload (payload, validators, options) {
	const errors = []
	for (const prop in payload) {
		if (options && options.strict) {
			if (!options.additionalProperties) {
				options.additionalProperties = []
			}
			if (!validators[prop] && options.additionalProperties.indexOf(prop) === -1) {
				errors.push('Unexpected property "' + prop + '"')
			}
		}

		if (validators[prop]) {
			const val = payload[prop]

			const validations = validators[prop]

			for (const test in validations) {
				const opts = validations[test]
				if (typeof opts === 'boolean') {
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
	}
	return errors
}

module.exports = {
	Validator: Validator,
	getMessage: getMessage,
	validatePayload: validatePayload,
	sanitizePayload: sanitizePayload
}
