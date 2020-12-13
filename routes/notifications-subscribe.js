const express = require('express')
const router = express.Router()

module.exports = function mount (app) {
	router.post('/notifications/subscribe', express.json(), (req, res, next) => {
		app.marlin.db.newInstance('NotificationSubscribers', {
			subscription: req.body
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
