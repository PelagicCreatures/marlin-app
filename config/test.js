const debug = require('debug')('antisocial-db');
const path = require('path');

module.exports = function (app) {
	debug('env: testing');

	let dbOptions = {};

	dbOptions = {
		dialect: "sqlite",
		storage: null,
		define: {
			charset: "utf8",
			freezeTableName: true
		},
		logging: false
	}

	let config = {

		siteName: 'Boilerplate User Web App',

		COOKIE_KEY: 'SeCretDecdrrnG',

		publicOptions: {},

		userOptions: {},

		dbOptions: dbOptions,

		adminOptions: {
			MOUNTPOINT: '/admin',
			UPLOAD_PATH: '/uploads/'
		}
	}

	return config;
}
