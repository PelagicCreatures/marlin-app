var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var uuid = require('uuid');

var app = express();

app.locals.sitename = 'User App Boilerplate'
app.locals.nonce = uuid.v4();

// options for client side javascript
// WARNING: NO PRIVATE INFO should be in app.locals.options
app.locals.options = {
  RECAPTCHA_PUBLIC: process.env.RECAPTCHA_PUBLIC,
  STRIPE_PUBLIC: process.env.STRIPE_PUBLIC
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser('SeCretDecdrrnG'));
app.use(express.static(path.join(__dirname, 'public')));

var MYSQLdbHandler = require('./modules/antisocial-users/lib/db-mysql');

var dbOptions = {
  host: process.env.DB_HOST ? process.env.DB_HOST : 'localhost',
  user: process.env.DB_USER ? process.env.DB_USER : 'testuser',
  password: process.env.DB_PASSWD ? process.env.DB_PASSWD : 'testpassword',
  db: process.env.DB_DBNAME ? process.env.DB_DBNAME : 'testusers',
  charset: 'utf8',
};

let db = new MYSQLdbHandler(dbOptions);

require('./modules/antisocial-users/lib/db-schema')(db);

app.db = db;

// set up and mount the user API
let userOptions = {
  RECAPTCHA: {
    public: process.env.RECAPTCHA_public,
    private: process.env.RECAPTCHA_private
  }
}
const userAPI = require('./modules/antisocial-users/index')(userOptions, app, db);

userAPI.on('didRegister', (user, post, cb) => {
  console.log('didRegister %j', user);
  cb();
})

app.use('/', require('./routes/index'));
app.use('/', require('./routes/user-pages')(userAPI));

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

module.exports = app;
