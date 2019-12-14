// copy this file into local.js, development.js, and production.js
// edit as needed. Good idea to keep secrets out of this file.
// load secrets from process.env or S3 or something
//
const debug = require('debug')('antisocial-db');
const path = require('path');

module.exports = function (app) {
	debug('env: local development');

	// admin visitor analytics
	// configure your endpoint and cookiename with benign non-tracking seeming names
	let trackUsers = {
		scope: 'shiny-happy-cookie-name',
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
			host: process.env.DB_HOST,
			username: process.env.DB_USER,
			password: process.env.DB_PASSWD,
			database: process.env.DB_DBNAME,
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
		dbOptions = {
			dialect: "sqlite",
			storage: 'working/database.sqlite',
			define: {
				charset: "utf8",
				freezeTableName: true
			},
			logging: false
		}
	}

	let config = {
		siteName: 'Boilerplate User Web App',

		COOKIE_KEY: 'SeCretDecdrrnG',

		BASIC_AUTH: {
			USER_NAME: process.env.BASIC_AUTH_USER_NAME,
			PASSWORD: process.env.BASIC_AUTH_PASSWORD
		},

		// expose options for client side javascript & pug templates
		// this is exposed as 'publicOptions.xxxx',
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

		// override default options for antisocial user API
		userOptions: {},

		// options for sequalize ORM database models
		dbOptions: dbOptions,

		// options for admin
		adminOptions: {
			MOUNTPOINT: '/admin',
			UPLOAD_PATH: '/uploads/'
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
