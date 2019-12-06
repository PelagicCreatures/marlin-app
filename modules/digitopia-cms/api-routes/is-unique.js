const debug = require('debug')('antisocial-user');
const WError = require('verror').WError;
const express = require('express');


const {
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

module.exports = (usersApp) => {

	debug('mounting users API /is-unique');

	let db = usersApp.db;

	function check(f, v, req, res) {

		var query = {};
		query[f] = v;

		var currentUser = req.antisocialUser;

		db.getInstances('User', {
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
	}

	usersApp.router.post('/is-unique-email', express.json(), getUserForRequestMiddleware(usersApp), function (req, res) {

		debug('/is-unique-email', req.body);

		if (!req.body.value) {
			return res.sendStatus(400);
		}

		check('email', req.body.value, req, res);
	});

	usersApp.router.post('/is-unique-username', express.json(), getUserForRequestMiddleware(usersApp), function (req, res) {

		debug('/is-unique-email', req.body);

		if (!req.body.value) {
			return res.sendStatus(400);
		}

		check('username', req.body.value, req, res);
	});
};
