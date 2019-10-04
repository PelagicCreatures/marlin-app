// Copyright Michael Rhodes. 2017,2018. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();

app.use(require('morgan')('dev'));

app.use(express.json());
app.use(express.urlencoded({
	extended: false
}));
app.use(cookieParser('someSecretThisIs'));

var db;

if (!process.env.MYSQL) {
	var dbHandler = require('./examples/db');
	db = new dbHandler();
}
else {
	var MYSQLdbHandler = require('./examples/db-mysql');

	db = new MYSQLdbHandler({
		host: 'localhost',
		user: 'testuser',
		password: 'testpassword',
		db: 'testdb',
		charset: 'utf8',
	});

	require('./lib/schema')(db);
}

app.db = db;
var userOptions = {};

const userAPI = require('./index')(userOptions, app, db);

var server = null;

app.start = function (port) {
	var http = require('http');
	server = http.createServer(app);
	var listener = server.listen(port);

	var config = {
		'APIPrefix': '/antisocial',
		'publicHost': 'http://127.0.0.1:3000',
		'port': 3000
	};

	var antisocialApp = antisocial(app, config, db, getUserForRequestMiddleware(db));

	imApp.init(antisocialApp);


	antisocialApp.listen(listener);
};

app.stop = function () {
	server.close();
};

if (require.main === module) {
	app.start(3000);
}

module.exports = app;
