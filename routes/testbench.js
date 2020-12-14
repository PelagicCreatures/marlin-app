const express = require('express')
const router = express.Router()
const Op = require('sequelize').Op
const webpush = require('web-push')
const {
	getUserForRequestMiddleware
} = require('@pelagiccreatures/marlin/lib/get-user-for-request-middleware')

webpush.setVapidDetails(
	'mailto:example@yourdomain.org',
	process.env.VAPID_PUBLIC,
	process.env.VAPID_SECRET
)

const sendNotifications = async (subs, message) => {
	const toSend = subs.map((sub) => {
		const sender = webpush.sendNotification(sub.subscription, message).then((result) => {
			return result
		}).catch((err) => {
			return err
		})
		return sender
	})

	const stats = await Promise.all(toSend)

	for (let i = 0; i < stats.length; i++) {
		if (stats[i].statusCode !== 200) {
			subs[i].lastStatusCode = stats[i].statusCode
			await subs[i].save()
		}
	}

	return stats
}

module.exports = function mount (app) {
	router.get('/testbench-push-notifications', getUserForRequestMiddleware(app.marlin), function (req, res, next) {
		if (!req.isAdmin) {
			return res.sendStatus(401)
		}

		app.marlin.db.getInstances('NotificationSubscribers', {
			where: {
				[Op.or]: [{
					lastStatusCode: null
				}, {
					lastStatusCode: 201
				}]
			}
		}, async (err, subs, count) => {
			if (err) {
				///
			}

			const result = sendNotifications(subs, 'Hi!')

			res.render('testbench', {
				result: JSON.stringify(result, null, 2)
			})
		})
	})

	return router
}
