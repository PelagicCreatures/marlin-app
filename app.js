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
var dbHandler = require('./modules/digitopia-cms/lib/db-sequelize');
app.db = new dbHandler(app, config.dbOptions);

// set up and mount the user API
app.userAPI = require('./modules/digitopia-cms/index')(app, config.userOptions);

if (config.analyticsOptions) {
  const analyics = require("./modules/digitopia-cms/lib/analytics");
  analyics.mount(app, config.analyticsOptions);
}

// set up user event handlers
require('./lib/user-events')(app);

// UI
app.use('/', require('./routes/index')(app));
app.use('/', require('./routes/testbench')(app));

// call asynchronous things that need to be stable before we can handle requests
app.start = function (done) {
  debug('starting app');
  app.db.sync(() => {
    debug('db sync done');

    // now that the db is up we can initialize /admin
    if (config.adminOptions) {
      app.admin = require("./modules/digitopia-cms/lib/admin");
      app.admin.mount(app, config.adminOptions);
    }

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
