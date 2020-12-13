const uuid = require('uuid')
const dns = require('dns')
const express = require('express')
const debug = require('debug')('marlin-analytics')
const async = require('async')
const moment = require('moment')
const path = require('path')

const Sequelize = require('sequelize')
const Op = Sequelize.Op

const {
	validatePayload, sanitizePayload
} = require('@pelagiccreatures/marlin/lib/validator-extensions')

const {
	getUserForRequestMiddleware
} = require('@pelagiccreatures/marlin/lib/get-user-for-request-middleware')

const {
	getAdmin,
	ensureRoleMiddleware
} = require('@pelagiccreatures/marlin/lib/admin')

const viewsPath = path.join(__dirname, '../', 'views')

function mount (app, options) {
	const router = express.Router()

	const userForRequestMiddleware = getUserForRequestMiddleware(app.marlin)

	debug('mounting analytics GET /dashboard')
	router.get('/dashboard', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		res.render(viewsPath + '/admin/dashboard', {})
	})

	// report given a date prefix and optional path report total: users, pageviews
	router.post('/report', express.json(), userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		const window = req.body.window ? req.body.window : 86400 * 1000
		const type = req.body.type ? req.body.type : 'pageview'
		const path = req.body.path ? req.body.path + '%' : '%'
		const windowStart = req.body.ts ? req.body.ts : new Date().getTime() - window
		const windowEnd = windowStart + window

		const query = {
			where: {
				[Op.and]: [{
					type: type
				}, {
					ts: {
						[Op.gte]: windowStart
					}
				}, {
					ts: {
						[Op.lte]: windowEnd
					}
				}, {
					path: {
						[Op.like]: path
					}
				}]
			},
			attributes: [
				'groupByHr', 'path', [Sequelize.literal('COUNT(DISTINCT(behaviorId))'), 'users'],
				[Sequelize.literal('COUNT(type)'), 'views']
			],
			raw: true,
			group: ['groupByHr', 'path'],
			order: Sequelize.literal('groupByHr DESC')
		}

		app.marlin.db.getModel('UserBehavior')
			.findAll(query)
			.then(function (result) {
				res.send({
					ts: windowStart,
					window: window,
					path: path,
					stats: result
				})
			})
			.catch(function (err) {})
	})

	debug('mounting analytics ' + options.method + ' ' + options.path)
	router[options.method](options.path, express.json(), userForRequestMiddleware, function (req, res) {
		const validators = getAdmin('UserBehavior').getValidations()

		const currentUser = req.antisocialUser

		const payload = req.body

		payload.ts = new Date().getTime()
		payload.groupByHr = moment(payload.ts).format('YYYYMMDDHH')

		if (!payload.behaviorId) {
			payload.behaviorId = uuid.v4()
		}

		if (!payload.referer) {
			payload.referer = req.headers.referer
		}

		payload.ua = req.headers['user-agent']

		if (currentUser) {
			payload.userId = currentUser.id
			payload.isLoggedIn = true
			payload.isSubscriber = currentUser.stripeStatus === 'ok'
		}

		const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress

		if (Object.prototype.toString.call(ip) === '[object Array]') {
			payload.ip = ip[0]
		} else {
			payload.ip = ip.split(', ')[0]
		}

		const errors = validatePayload(payload, validators, {
			strict: true
		})

		if (errors.length) {
			return res
				.status(422)
				.json({
					status: 'error',
					errors: errors
				})
		}

		async.series([
			(cb) => {
				dns.reverse(ip, function (err, hostnames) {
					if (!err) {
						payload.hostname = hostnames.join(',')
					}
					cb()
				})
			}
		], function (err) {
			if (err) {
				return res.send({
					status: 'error',
					behaviorId: payload.behaviorId
				})
			}

			debug('/behavior %j', req.body)

			app.marlin.db.newInstance('UserBehavior', payload, (err) => {
				if (err) {
					return res.send({
						status: 'error',
						behaviorId: payload.behaviorId
					})
				}

				res.send({
					status: 'ok',
					behaviorId: payload.behaviorId
				})
			})
		})
	})

	debug('mounting analytics on %s', options.mountPoint)

	app.use(options.mountPoint, router)
}

module.exports = {
	mount: mount
}
