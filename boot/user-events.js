const debug = require('debug')('antisocial-db-events')
var mailer = require('../lib/mail')
var VError = require('verror').VError

module.exports = (app) => {
	app.userAPI.on('didRegister', (user, post, cb) => {
		debug('didRegister event user: %j', user)
		cb()
	})

	// send confirmation email
	app.userAPI.on('sendEmailConfirmation', function (user, token) {
		if (app.config.MAILER) {
			debug('sendEmailConfirmation event user: %j token: %j', user, token)
			var url = app.locals.publicOptions.PUBLIC_HOST + '/users/validate?token=' + token.token

			var options = {
				to: user.email,
				from: app.config.OUTBOUND_MAIL_SENDER,
				subject: 'Thanks For Registering',
				user: user,
				url: url
			}

			mailer(app, 'emails/verify', options, function (err) {
				if (err) {
					var e = new VError(err, 'could not send verification email')
					debug(e.toString())
					debug(e.stack)
				}
			})
		}
	})

	// send password reset email
	app.userAPI.on('sendPasswordReset', function (user, token) {
		if (app.config.MAILER) {
			debug('sendPasswordReset user: %j token: %j', user, token)
			var url = app.locals.publicOptions.PUBLIC_HOST + '/users/password-set?token=' + token.token

			var options = {
				to: user.email,
				from: app.config.OUTBOUND_MAIL_SENDER,
				subject: 'Password Reset Request',
				user: user,
				url: url
			}

			mailer(app, 'emails/reset', options, function (err) {
				if (err) {
					var e = new VError(err, 'could not send reset email')
					debug(e.toString())
					debug(e.stack)
				}
			})
		}
	})

	app.db.on('db-create', function (table, instance) {
		debug('db-create %s instance id %s', table, instance.id)
	})

	app.db.on('db-update', function (table, instance) {
		debug('db-update %s instance id %s', table, instance.id)
	})

	app.db.on('db-delete', function (table, instance) {
		debug('db-delete %s instance id %s', table, instance.id)
	})
}
