module.exports = function (app) {
	console.log('env: local development');

	let config = {
		siteName: 'Boilerplate User Web App',
		// options for client side javascript & pug templates
		// in templates exposed as 'options.xxxx',
		// in JS exposed as 'publicOptions.xxxx'
		// WARNING: NO PRIVATE INFO should be in app.locals.publicOptions
		publicOptions: {
			PUBLIC_HOST: process.env.PUBLIC_HOST,
			RECAPTCHA_PUBLIC: process.env.RECAPTCHA_PUBLIC,
			STRIPE_PUBLIC: process.env.STRIPE_PUBLIC,
			STRIPE_YEARLY: process.env.STRIPE_YEARLY,
			STRIPE_MONTHLY: process.env.STRIPE_MONTHLY
		},
		// override default options for antisocial user API (see modules/antisocial-users/index.js)
		userOptions: {},
		// options for sequalize ORM database models
		dbOptions: {
			host: process.env.DB_HOST ? process.env.DB_HOST : 'localhost',
			username: process.env.DB_USER ? process.env.DB_USER : 'testuser',
			password: process.env.DB_PASSWD ? process.env.DB_PASSWD : 'testpassword',
			database: process.env.DB_DBNAME ? process.env.DB_DBNAME : 'testusers',
			dialect: "mysql",
			pool: {
				max: 5,
				min: 0,
				idle: 10000
			},
			define: {
				engine: "INNODB",
				charset: "utf8",
				collate: "utf8_general_ci",
				freezeTableName: true
			}
		},
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
