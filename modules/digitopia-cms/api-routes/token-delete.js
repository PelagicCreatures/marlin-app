const VError = require('verror').VError;
const debug = require('debug')('antisocial-user');
const express = require('express');

const {
	getUserForRequestMiddleware
} = require('../lib/get-user-for-request-middleware');

module.exports = (usersApp) => {

	debug('mounting users API /token-delete');

	usersApp.router.delete('/token-delete', express.urlencoded({
		extended: false
	}), getUserForRequestMiddleware(usersApp), function (req, res) {
		var currentUser = req.antisocialUser;
		if (!currentUser) {
			return res.status(401).json({
				status: 'error',
				flashLevel: 'danger',
				flashMessage: 'Token delete failed',
				errors: ['must be logged in']
			});
		}

		usersApp.db.getInstances('Token', {
			where: {
				userId: req.antisocialUser.id,
				type: 'access',
				id: req.query.token
			},
			order: [
				['createdAt', 'ASC']
			]
		}, function (err, tokenInstances) {
			if (err) {
				return res.status(500).send({
					status: 'error',
					flashLevel: 'danger',
					flashMessage: 'Token delete failed',
					errors: [err.message]
				});
			}

			if (!tokenInstances || !tokenInstances.length) {
				return res.status(403).send({
					status: 'error',
					flashLevel: 'danger',
					flashMessage: 'Token delete failed',
					errors: ['token not found']
				});
			}

			usersApp.db.deleteInstance('Token', tokenInstances[0].id, function (err) {
				if (err) {
					return res.status(500).send({
						'status': 'error',
						'flashLevel': 'danger',
						'flashMessage': 'Token delete failed',
						'errors': [
							err.message
						]
					});
				}
				res.send({
					'status': 'ok',
					'flashLevel': 'info',
					'flashMessage': 'Login token deleted.'
				});
			});
		});
	});
};
