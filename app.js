const createError = require('http-errors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');
const helmet = require('helmet');
const debug = require('debug')('antisocial-user');

if (process.env.ENVFILE) {
	console.log('loading env:' + process.env.ENVFILE)
	require('dotenv').config({
		path: process.env.ENVFILE
	});
}

const app = express();

// setup configuration from config file for environment
let config = require('./config/' + app.get('env'))(app);

// app.locals properties are exposed to pug templates
app.locals.sitename = config.siteName;
app.locals.publicOptions = config.publicOptions;
app.locals.nonce = uuid.v4();
app.locals.moment = require('moment');

// Content Security Profile for browser
if (config.cspOptions && config.cspOptions.directives) {
	const csp = require('helmet-csp');
	app.use(helmet());
	app.use(csp(config.cspOptions));
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
if (app.get('env') !== 'production') {
	app.locals.pretty = true;
}

// http logs
if (config.LOGGER_LEVEL) {
	const logger = require('morgan');
	app.use(logger(config.LOGGER_LEVEL));
}

// use basic-auth for development environment
if (config.BASIC_AUTH && !process.env.TESTING) {
	var basicAuth = require('./lib/basicAuth')(config.BASIC_AUTH);
	app.use(basicAuth);
}

// parse cookies in all routes
app.use(cookieParser(config.COOKIE_KEY));

// deliver static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// set up and mount the user API
app.userAPI = require('./modules/digitopia-cms/index')(app, config);

let bootDir = path.join(__dirname, 'boot')
fs
	.readdirSync(bootDir)
	.filter(file => {
		return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
	})
	.forEach(file => {
		debug('boot/' + file);
		require(path.join(bootDir, file))(app);
	});

let routesDir = path.join(__dirname, 'routes')
fs
	.readdirSync(routesDir)
	.filter(file => {
		return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
	})
	.forEach(file => {
		debug('routes/' + file);
		app.use('/', require(path.join(routesDir, file))(app));
	});

// Call asynchronous things that need to be stable
// before we can handle requests
// NOTE: /admin routes are mounted by this so error
// handlers need to be defined after this call
app.start = function (done) {
	debug('starting app');
	app.db.sync(() => {
		debug('db sync done');

		// catch 404 and forward to error handler
		app.use(function (req, res, next) {
			next(createError(404));
		});

		// error handler
		app.use(function (err, req, res, next) {
			if (res.headersSent) {
				return next(err)
			}

			if (err.code === 'EBADCSRFTOKEN') {
				return res.status(403).send({
					status: 'error',
					errors: ['invalid csrf']
				});
			}

			res.locals.message = err.cause && err.cause() ? err.cause().message : err.message;

			if (req.headers['x-digitopia-hijax']) {
				res.set('x-digitopia-hijax-flash-level', 'danger');
				res.set('x-digitopia-hijax-flash-message', res.locals.message);
			}

			// set locals, only providing error details in development
			res.locals.error = err;
			res.locals.verbose = req.app.get('env') === 'local' || req.app.get('env') === 'development';
			// render the error page
			res.status(err.status || 500);
			res.render('error');
		});

		done();
	});
}

module.exports = app;
