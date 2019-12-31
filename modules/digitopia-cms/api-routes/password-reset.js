const debug = require('debug')('antisocial-user')
const csrf = require('csurf')
const express = require('express')
const getAdmin = require('../lib/admin').getAdmin
const VError = require('verror').VError
const async = require('async')
const request = require('request')

const {
	validatePayload
} = require('../lib/validator-extensions')

const csrfProtection = csrf({
	cookie: {
		signed: true,
		httpOnly: true
	},
	ignoreMethods: process.env.TESTING ? ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'] : []
})

module.exports = (usersApp) => {
	debug('mounting users API /password-reset')

	const db = usersApp.db

	const createToken = require('../lib/create-token.js')(usersApp)

	usersApp.router.patch('/password-reset', express.json(), csrfProtection, function (req, res) {
		debug('/password-reset')

		const validators = getAdmin('User').getValidations()

		const errors = validatePayload(req.body, {
			email: validators.email
		}, {
			strict: true,
			additionalProperties: ['g-recaptcha-response', '_csrf']
		})

		if (errors.length) {
			return res
				.status(422)
				.json({
					status: 'error',
					errors: errors
				})
		}

		var ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress

		if (Object.prototype.toString.call(ip) === '[object Array]') {
			ip = ip[0]
		} else {
			ip = ip.split(', ')[0]
		}

		async.waterfall([
			function captcha (cb) {
				if (!process.env.RECAPTCHA_SECRET) {
					return cb()
				}

				if (!req.body['g-recaptcha-response']) {
					return cb(new VError('missing required information'))
				}

				var recaptchaURL = 'https://www.google.com/recaptcha/api/siteverify?'
				recaptchaURL += 'secret=' + process.env.RECAPTCHA_SECRET + '&'
				recaptchaURL += 'response=' + req.body['g-recaptcha-response'] + '&'
				recaptchaURL += 'remoteip=' + ip

				request(recaptchaURL, function (err, captchaRes, captchaBody) {
					if (err || captchaRes.statusCode !== 200) {
						return cb(new VError(err, 'Captcha validation request failed'))
					}

					captchaBody = JSON.parse(captchaBody)
					if (!captchaBody.success) {
						return cb(new VError('Captcha validation failed'))
					}

					if (captchaBody.action !== 'social') {
						return cb(new VError('Captcha action mismatch'))
					}

					if (captchaBody.score < 0.5) {
						return cb(new VError('Captcha low score'))
					}

					cb()
				})
			},
			function (cb) {
				db.getInstances('User', {
					where: {
						email: req.body.email
					}
				}, function (err, userInstances) {
					if (err) {
						return cb(new VError(err, 'could not read user'))
					}

					if (!userInstances || userInstances.length !== 1) {
						return cb(new VError('user not found'))
					}

					cb(null, userInstances[0])
				})
			},
			function (user, cb) {
				createToken(user, {
					ttl: usersApp.options.PASSWORD_RESET_TTL,
					type: 'reset'
				}, function (err, token) {
					if (err) {
						return cb(new VError(err, 'error creating reset token'))
					}
					cb(null, user, token)
				})
			}
		], function (err, user, token) {
			if (err) {
				return res.status(500).json({
					status: 'error',
					errors: [err.message]
				})
			}

			usersApp.emit('sendPasswordReset', user, token)

			res.send({
				status: 'ok',
				flashLevel: 'success',
				flashMessage: 'Message sent to ' + user.email + '. Please check your email.'
			})
		})
	})
}
