const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');
const helmet = require('helmet');
const debug = require('debug')('antisocial-user');

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

// parse cookies in all routes
app.use(cookieParser('SeCretDecdrrnG'));

// deliver static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// setup DB (sequelize) & load models
var dbHandler = require('./lib/db-sequelize');
app.db = new dbHandler(app, config.dbOptions);

if (config.dbOptions.ADMIN) {
  const admin = require("./lib/admin");
  admin.mount(app, app.db, config.dbOptions.ADMIN);
}

// set up and mount the user API
const userAPI = require('./modules/antisocial-users/index')(config.userOptions, app, app.db);

// set up user event handlers
require('./lib/user-events')(userAPI);

// UI
app.use('/', require('./routes/index')(userAPI));
app.use('/', require('./routes/user-pages')(userAPI));

// error response for bad _csrf in forms
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
  res.status(403).send({
    status: 'error',
    errors: ['invalid csrf']
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// call asynchronous things that need to be stable before we can handle requests
app.start = function (done) {
  debug('starting app');
  app.db.sync(() => {
    debug('db sync done');
    done();
  });
}

module.exports = app;
