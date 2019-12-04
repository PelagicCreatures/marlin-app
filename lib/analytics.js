const uuid = require('uuid');
const dns = require('dns');
const express = require('express');
const debug = require('debug')('antisocial-analytics');
const async = require('async');
const moment = require('moment');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const {
	validatePayload, sanitizePayload
} = require('./validator-extensions');

const {
	getUserForRequestMiddleware
} = require('../modules/antisocial-users/lib/get-user-for-request-middleware');

const {
	getAdmin,
	ensureRoleMiddleware
} = require('./admin');

function mount(app, db, options) {
	let router = express.Router();

	let userForRequestMiddleware = getUserForRequestMiddleware({
		db: db
	});

	debug('mounting analytics GET /dashboard')
	router.get('/dashboard', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		res.render('admin/dashboard', {});
	});

	// report given a date prefix and optional path report total: users, pageviews
	router.post('/report', express.json(), userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let window = req.body.window ? req.body.window : 86400 * 1000;
		let windowStart = req.body.ts ? req.body.ts : new Date().getTime() - window;
		let windowEnd = windowStart + window;

		var query = {
			where: {
				[Op.and]: [{
					type: req.body.type ? req.body.type : 'pageview'
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
						[Op.like]: req.body.path ? req.body.path + '%' : '%'
					}
				}]
			},
			attributes: [
				'groupByHr', [Sequelize.literal('COUNT(DISTINCT(behaviorId))'), 'users'],
				[Sequelize.literal('COUNT(type)'), 'views']
			],
			raw: true,
			group: ['groupByHr'],
			order: Sequelize.literal('groupByHr DESC')
		}

		db.getModel('UserBehavior')
			.findAll(query)
			.then(function (result) {
				res.send(result);
			})
			.catch(function (err) {});

	})

	debug('mounting analytics ' + options.method + ' ' + options.path)
	router[options.method](options.path, express.json(), userForRequestMiddleware, function (req, res) {
		let validators = getAdmin('UserBehavior').getValidations();

		var currentUser = req.antisocialUser;

		let payload = req.body;

		payload.ts = new Date().getTime();
		payload.groupByHr = moment(payload.ts).format('YYYYMMDDHH')

		if (!payload.behaviorId) {
			payload.behaviorId = uuid.v4();
		}

		if (!payload.referer) {
			payload.referer = req.headers['referer'];
		}

		payload.ua = req.headers['user-agent'];

		if (currentUser) {
			payload.userId = currentUser.id;
			payload.isLoggedIn = true;
			payload.isSubscriber = currentUser.stripeStatus === 'ok';
		}

		let ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;

		if (Object.prototype.toString.call(ip) === '[object Array]') {
			payload.ip = ip[0];
		}
		else {
			payload.ip = ip.split(', ')[0];
		}

		let errors = validatePayload(payload, validators, {
			strict: true,
		});

		if (errors.length) {
			return res
				.status(422)
				.json({
					status: 'error',
					errors: errors
				});
		}

		async.series([
			(cb) => {
				dns.reverse(ip, function (err, hostnames) {
					if (!err) {
						payload.hostname = hostnames.join(',');
					}
					cb();
				});
			}
		], function (err) {
			if (err) {
				return res.send({
					status: 'error',
					behaviorId: payload.behaviorId
				});
			}

			debug('/behavior %j', req.body);

			db.newInstance('UserBehavior', payload, (err) => {
				if (err) {
					return res.send({
						status: 'error',
						behaviorId: payload.behaviorId
					});
				}

				res.send({
					status: 'ok',
					behaviorId: payload.behaviorId
				});
			});
		});
	});

	debug('mounting analytics on %s', options.mountPoint);

	app.use(options.mountPoint, router);
}

module.exports = {
	mount: mount
}
