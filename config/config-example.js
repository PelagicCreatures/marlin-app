// copy this file into local.js, development.js, and production.js
// edit as needed. Good idea to keep secrets out of this file.
// load secrets from process.env (shown) or S3 or something

const debug = require('debug')('marlin-db')
const path = require('path')

module.exports = function (app) {
	debug('env: local')

	const config = {
		siteName: 'Boilerplate User Web App',

		// publicOptions exposes options for client side javascript & pug templates
		// this is exposed as 'publicOptions.xxxx',
		// WARNING: NO PRIVATE INFO should be here
		publicOptions: {
			COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
			PUBLIC_HOST: process.env.PUBLIC_HOST,
			RECAPTCHA_PUBLIC: process.env.RECAPTCHA_PUBLIC,
			STRIPE_PUBLIC: process.env.STRIPE_PUBLIC,
			STRIPE_YEARLY: process.env.STRIPE_YEARLY,
			STRIPE_MONTHLY: process.env.STRIPE_MONTHLY,
			SERVICE_WORKER: '/service-worker.js',
			MANIFEST: '/manifest.json',
			NOTIFICATIONS_PK: process.env.VAPID_PUBLIC,
			USER_BEHAVIOR: { // experimental
				scope: 'shiny-happy-cookie',
				method: 'put',
				path: '/collect',
				mountPoint: '/behavior',
				endpoint: '/behavior/collect'
			}
		},

		COOKIE_KEY: 'SeCretDecdrrnG',

		BASIC_AUTH: process.env.BASIC_AUTH_USER_NAME && process.env.BASIC_AUTH_PASSWORD ? {
			USER_NAME: process.env.BASIC_AUTH_USER_NAME,
			PASSWORD: process.env.BASIC_AUTH_PASSWORD
		} : null,

		MAILER: {
			OUTBOUND_MAIL: 'SMTP',
			OUTBOUND_MAIL_SMTP_HOST: 'email-smtp.us-east-1.amazonaws.com',
			OUTBOUND_MAIL_SMTP_USER: process.env.SMTP_USER,
			OUTBOUND_MAIL_SMTP_PASSWORD: process.env.SMTP_PASSWORD
		},
		OUTBOUND_MAIL_SENDER: 'mrhodes@myantisocial.net',

		// morgan logger
		LOGGER_LEVEL: 'dev',

		// options for sequalize ORM database models
		dbOptions: {
			dialect: 'sqlite',
			storage: 'working/database.sqlite',
			define: {
				charset: 'utf8',
				freezeTableName: true
			},
			logging: false,
			models: path.join(__dirname, '../', 'models')
		},

		// options for admin
		adminOptions: {
			MOUNTPOINT: '/admin',
			UPLOAD_PATH: '/uploads/'
		},

		// content security profile (helmet-csp module)
		cspOptions: {
			directives: {
				defaultSrc: ['\'self\''],
				scriptSrc: ['\'self\'', '\'unsafe-eval\'', function (req, res) {
					return '\'nonce-' + app.locals.nonce + '\''
				}],
				fontSrc: ['\'self\'', 'fonts.gstatic.com'],
				styleSrc: ['\'self\'', '\'unsafe-inline\''],
				frameSrc: ['\'self\'', 'js.stripe.com', 'www.google.com'],
				mediaSrc: ['\'self\''],
				imgSrc: ['\'self\'', 'data:', '*', 'blob:'],
				sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin', 'allow-modals', 'allow-popups'],
				objectSrc: ['\'none\''],
				workerSrc: ['\'self\'', 'blob:'],
				'connect-src': ['\'self\''],
				'child-src': ['\'self\'', 'data:', '*', 'blob:']
			},
			upgradeInsecureRequests: false,
			reportOnly: false
		},

		analyticsOptions: { // experimental
			scope: 'shiny-happy-cookie',
			method: 'put',
			path: '/collect',
			mountPoint: '/behavior',
			endpoint: '/behavior/collect'
		}
	}

	return config
}

/*

Other Examples:

	// dbOptions is passed directly to Sequelize so for mysql it's something like
	dbOptions = {
		dialect: 'mysql',
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
			engine: 'INNODB',
			charset: 'utf8',
			dialectOptions: {
				collate: 'utf8_general_ci'
			},
			freezeTableName: true
		},
		logging: false,
		models: path.join(__dirname, '../', 'models')
	}

*/
