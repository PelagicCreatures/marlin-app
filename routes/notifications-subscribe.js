const express = require('express')
const router = express.Router()

const {
	getUserForRequestMiddleware
} = require('@pelagiccreatures/marlin/lib/get-user-for-request-middleware')

module.exports = function mount (app) {
	router.post('/notifications/subscribe', express.json(), getUserForRequestMiddleware(app.marlin), (req, res, next) => {
		if (!req.antisocialUser) {
			return res.status(401).json({
				status: 'error',
				errors: ['must be logged in']
			})
		}

		app.marlin.db.newInstance('NotificationSubscribers', {
			subscription: req.body,
			userId: req.antisocialUser || null
		}, function (err, user) {
			if (err) {
				res.send({
					status: 'error',
					error: err
				})
			}
			res.send({
				status: 'ok'
			})
		})
	})

	return router
}
