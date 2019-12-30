var nodemailer = require('nodemailer')
var VError = require('verror').VError
var pug = require('pug')
var debug = require('debug')('mail')
var rateLimit = require('function-rate-limit')

function mail (app, template, options, cb) {
	var transporter
	if (app.config.MAILER.OUTBOUND_MAIL === 'SES') {
		let config
		if (app.config.MAILER.SES_KEY_ID && app.config.MAILER.SES_KEY) {
			config = {
				service: 'SES-US-EAST-1',
				auth: {
					user: app.config.MAILER.SES_KEY_ID,
					pass: app.config.MAILER.SES_KEY
				}
			}
			debug('using SES %j', config)
		} else {
			var AWS = require('aws-sdk')
			if (app.config.MAILER.AWS_CONFIG) {
				AWS.config.loadFromPath(app.config.MAILER.AWS_CONFIG)
			} else {
				AWS.config.credentials = new AWS.EC2MetadataCredentials()
			}
			config = {
				SES: new AWS.SES({
					apiVersion: '2010-12-01'
				})
			}
		}

		transporter = nodemailer.createTransport(config)
	} else if (app.config.MAILER.OUTBOUND_MAIL === 'SENDMAIL') {
		transporter = nodemailer.createTransport({
			sendmail: true,
			newline: 'unix',
			path: app.config.MAILER.OUTBOUND_MAIL_SENDMAIL_PATH || '/usr/sbin/sendmail'
		})
	} else if (app.config.MAILER.OUTBOUND_MAIL === 'SMTP') {
		const config = {
			host: app.config.MAILER.OUTBOUND_MAIL_SMTP_HOST,
			port: app.config.MAILER.OUTBOUND_MAIL_SMTP_PORT || 465,
			secure: true
		}

		if (app.config.MAILER.OUTBOUND_MAIL_SMTP_USER && app.config.MAILER.OUTBOUND_MAIL_SMTP_PASSWORD) {
			config.auth = {
				user: app.config.MAILER.OUTBOUND_MAIL_SMTP_USER,
				pass: app.config.MAILER.OUTBOUND_MAIL_SMTP_PASSWORD
			}
		}

		transporter = nodemailer.createTransport(config)
	} else {
		return cb()
	}

	debug('payload %j', options)

	pug.renderFile(app.get('views') + '/' + template + '.pug', options, function (err, html) {
		if (err) {
			debug('render errors %j', err)
			var e = new VError(err, 'could not render email')
			return cb(e)
		}
		options.html = html
		transporter.sendMail(options, function (err, info) {
			debug('email result %j %j', err, info, html)
			if (err) {
				var e = new VError(err, 'could not send email')
				return cb(e)
			}
			cb(null, info)
		})
	})
}

var rateLimited = rateLimit(2, 1000, mail)

module.exports = rateLimited
