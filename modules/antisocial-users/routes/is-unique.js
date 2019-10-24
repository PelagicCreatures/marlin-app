const debug = require('debug')('antisocial-user');
const WError = require('verror').WError;

const {
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

module.exports = (usersApp) => {

	debug('mounting users API /is-unique');

	let db = usersApp.db;

	usersApp.router.get('/is-unique', getUserForRequestMiddleware(usersApp), function (req, res) {

		debug('/is-unique', req.query);

		var f = req.query.field;

		if ((f !== 'username' && f !== 'email') || !req.query.value) {
			return res.sendStatus(400);
		}

		var query = {};
		query[f] = req.query.value;

		var currentUser = req.antisocialUser;

		db.getInstances('users', {
			where: query
		}, function (err, userInstances) {
			if (err) {
				let e = new WError(err, 'error reading users');
				return res.send({
					error: e.message,
					found: false
				});
			}

			if (!userInstances || !userInstances.length) {
				return res.send({
					found: false
				});
			}

			// match BUT it is the user making the request so ok...
			if (currentUser && userInstances.length === 1 && userInstances[0].id === currentUser.id) {
				return res.send({
					found: false
				});
			}

			return res.send({
				found: true
			});
		});
	});
};
