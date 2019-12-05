const debug = require('debug')('antisocial-db');
const path = require('path');

module.exports = function (app) {
	debug('env: local development');

	// admin visitor analytics
	let trackUsers = {
		scope: 'shiny-happy-cookie',
		method: 'put',
		path: '/collect',
		mountPoint: '/behavior',
		endpoint: '/behavior/collect'
	}

	// options for sequalize ORM database models
	// use mysql if environment DB_DIALECT set to 'mysql', otherwise sqlite
	let dbOptions = {};
	if (process.env.DB_DIALECT === 'mysql') {
		dbOptions = {
			dialect: "mysql",
			host: process.env.DB_HOST ? process.env.DB_HOST : 'localhost',
			username: process.env.DB_USER ? process.env.DB_USER : 'testuser',
			password: process.env.DB_PASSWD ? process.env.DB_PASSWD : 'testpassword',
			database: process.env.DB_DBNAME ? process.env.DB_DBNAME : 'testusers',
			pool: {
				max: 5,
				min: 0,
				idle: 10000
			},
			define: {
				engine: "INNODB",
				charset: "utf8",
				dialectOptions: {
					collate: "utf8_general_ci"
				},
				freezeTableName: true
			},
			logging: false
		}
	}
	else {
		if (process.env.TESTING) {
			debug('env.TESTING set, using sqlite memory db');
		}
		dbOptions = {
			dialect: "sqlite",
			storage: process.env.TESTING ? null : 'working/database.sqlite',
			define: {
				charset: "utf8",
				freezeTableName: true
			},
			logging: false
		}
	}

	let config = {
		siteName: 'Boilerplate User Web App',

		// options for client side javascript & pug templates
		// in templates exposed as 'options.xxxx',
		// in JS exposed as 'publicOptions.xxxx'
		// WARNING: NO PRIVATE INFO should be in app.locals.publicOptions
		publicOptions: {
			COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
			PUBLIC_HOST: process.env.PUBLIC_HOST,
			RECAPTCHA_PUBLIC: process.env.RECAPTCHA_PUBLIC,
			STRIPE_PUBLIC: process.env.STRIPE_PUBLIC,
			STRIPE_YEARLY: process.env.STRIPE_YEARLY,
			STRIPE_MONTHLY: process.env.STRIPE_MONTHLY,
			USER_BEHAVIOR: trackUsers
		},

		// morgan logger
		LOGGER_LEVEL: 'dev',

		// override default options for antisocial user API (see modules/antisocial-users/index.js)
		userOptions: {},

		// options for sequalize ORM database models
		dbOptions: dbOptions,

		// options for admin
		adminOptions: {
			MOUNTPOINT: '/admin',
			UPLOAD_PATH: '/uploads'
		},

		analyticsOptions: trackUsers,

		// content security profile (helmet-csp module)
		cspOptions: {
			'directives': {
				'defaultSrc': ['\'self\''],
				'connect-src': ['\'self\''],
				'scriptSrc': ['\'self\'', 'js.stripe.com', '\'unsafe-eval\'', function (req, res) {
					return '\'nonce-' + app.locals.nonce + '\'';
				}],
				'fontSrc': ['\'self\'', 'fonts.gstatic.com'],
				'styleSrc': ['\'self\'', 'fonts.googleapis.com', '\'unsafe-inline\''],
				'frameSrc': ['\'self\'', 'js.stripe.com'],
				'mediaSrc': ['\'self\''],
				'imgSrc': ['\'self\'', 'data:'],
				'sandbox': ['allow-forms', 'allow-scripts', 'allow-same-origin', 'allow-modals'],
				'objectSrc': ['\'none\''],
				'upgradeInsecureRequests': false
			},
			'loose': false,
			'reportOnly': false,
			'setAllHeaders': false,
			'disableAndroid': false,
			'browserSniff': false
		}
	}

	return config;
}
