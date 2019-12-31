const VError = require('verror').VError
const debug = require('debug')('antisocial-user')
const async = require('async')
const request = require('request')
const csrf = require('csurf')
const express = require('express')
const getAdmin = require('../lib/admin').getAdmin

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
	debug('mounting users API /register')

	const createUser = require('../lib/create-user.js')(usersApp)
	const createToken = require('../lib/create-token.js')(usersApp)

	// create a new user
	usersApp.router.put('/register', express.json(), csrfProtection, function (req, res) {
		debug('/register', req.body)

		const validators = getAdmin('User').getValidations()

		const errors = validatePayload(req.body, {
			email: validators.email,
			username: validators.username,
			password: {
				isPassword: true
			}
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
					return setImmediate(cb)
				}

				if (!req.body['g-recaptcha-response']) {
					return cb(new VError('missing required information'))
				}

				var recaptchaURL = 'https://www.google.com/recaptcha/api/siteverify?'
				recaptchaURL += 'secret=' + process.env.RECAPTCHA_SECRET + '&'
				recaptchaURL += 'response=' + req.body['g-recaptcha-response'] + '&'
				recaptchaURL += 'remoteip=' + ip

				request(recaptchaURL, function (err, captchaRes, captchaBody) {
					if (err || captchaRes.statusCode != 200) {
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
				createUser(req.body, function (err, user) {
					cb(err, user)
				})
			},
			function (user, cb) {
				usersApp.db.getInstances('User', {}, (err, users, count) => {
					if (err) {
						cb(new VError(err, 'checking if first user'))
					}
					if (count > 1) {
						return cb(null, user)
					}
					// make the first user the superuser
					usersApp.db.getInstances('Role', {
						where: {
							description: 'superuser'
						}
					}, (err, roles) => {
						if (err) {
							cb(new VError(err, 'first user finding superuser role'))
						}

						usersApp.db.newInstance('UserRole', {
							userId: user.id,
							roleId: roles[0].id
						}, (err) => {
							if (err) {
								return cb(new VError(err, 'first user attaching superuser role'))
							}
							cb(null, user)
						})
					})
				})
			},
			function (user, cb) {
				createToken(user, {
					ip: ip
				}, function (err, token) {
					cb(err, user, token)
				})
			},
			function (user, loginToken, cb) {
				createToken(user, {
					ttl: usersApp.options.EMAIL_CONFIRM_TTL,
					type: 'validate'
				}, function (err, token) {
					usersApp.emit('sendEmailConfirmation', user, token)
					cb(err, user, loginToken)
				})
			}
		], function (err, user, token) {
			if (err) {
				return res.status(400).json({
					status: 'error',
					flashLevel: 'danger',
					flashMessage: 'Registration failed',
					errors: [err.message]
				})
			}

			usersApp.emit('didRegister', user, req.body, function (err) {
				res.cookie('access-token', token.token, {
					path: '/',
					maxAge: token.ttl * 1000,
					signed: true,
					httpOnly: true
				})
					.cookie('logged-in', 1, {
						path: '/',
						maxAge: token.ttl * 1000
					})
					.json({
						status: 'ok',
						flashLevel: 'success',
						flashMessage: 'Saved. Please check your email for confirmation.',
						didLogin: true,
						result: {
							id: user.id,
							name: user.name,
							username: user.username,
							email: user.email
						}
					})
			})
		})
	})
}
