const debug = require('debug')('antisocial-user');

const {
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

module.exports = (usersApp) => {

	debug('mounting users API /logout');

	let db = usersApp.db;

	usersApp.router.get('/logout', getUserForRequestMiddleware(usersApp), function (req, res) {

		var currentUser = req.antisocialUser;
		if (!currentUser) {
			return res.status(401).json({
				status: 'error',
				errors: [{
					msg: 'must be logged in'
				}]
			});
		}

		db.deleteInstance('tokens', req.antisocialToken.id, function (err) {

			if (process.env.STRIPE_SECRET) {
				if (currentUser.stripeStatus === 'ok') {
					res.clearCookie('subscriber', {
						'path': '/'
					});
				}
			}

			res.clearCookie('access-token', {
				'path': '/',
				'signed': true
			}).send({
				'status': 'ok',
				'didLogut': true
			});
		});
	});
};
