var request = require('superagent');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('uuid');
var async = require('async');

describe('friends', function () {
	this.timeout(50000);

	var client1 = request.agent();
	var client2 = request.agent();
	var client3 = request.agent();

	var token1;
	var token2;

	var app = require('../app');

	before(function (done) {
		var app = require('../app');
		var http = require('http');
		server = http.createServer(app);
		var listener = server.listen(3000);
		done();
	});

	after(function (done) {
		setTimeout(function () {
			server.close();
			done();
		}, 1000);
	});

	it('should not be able to post invalid register payload', function (done) {
		client1.post('http://127.0.0.1:3000/api/users/register')
			.type('form')
			.send({
				'password': 'test with spaces'
			})
			.end(function (err, res) {
				expect(res.status).to.equal(422);
				expect(res.body.errors).to.be.an('array');
				console.log('errors: ', res.body.errors);
				done();
			});
	});

	it('should be able to create account 1', function (done) {
		client1.post('http://127.0.0.1:3000/api/users/register')
			.type('form')
			.send({
				'name': 'user one',
				'username': 'user-one',
				'email': 'mrhodes+1@myantisocial.net',
				'password': 'Testing123'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body.errors : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				token1 = getCookie(res.headers['set-cookie'], 'access-token');
				expect(token1).to.be.a('string');
				done();
			});
	});

	it('should be able to create account 2', function (done) {
		client2.post('http://127.0.0.1:3000/api/users/register')
			.type('form')
			.send({
				'name': 'user two',
				'username': 'user-two',
				'email': 'mrhodes+2@myantisocial.net',
				'password': 'Testing123'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body.errors : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				token2 = getCookie(res.headers['set-cookie'], 'access-token');
				expect(token2).to.be.a('string');
				done();
			});
	});

	/*
	it('should be able to send password reset', function (done) {
		client3.post('http://127.0.0.1:3000/api/users/password-reset')
			.type('form')
			.send({
				'email': 'mrhodes+1@myantisocial.net'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: ', res.body.errors);
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				done();
			});
	});

	it('should be able to logout', function (done) {
		client1.get('http://127.0.0.1:3000/api/users/logout')
			.end(function (err, res) {
				if (err) {
					console.log('errors: ', res.body.errors);
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				done();
			});
	});

	it('should be able to log in again', function (done) {
		client1.post('http://127.0.0.1:3000/api/users/login')
			.type('form')
			.send({
				'email': 'mrhodes+1@myantisocial.net',
				'password': 'Testing123'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: ', res.body.errors);
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				token1 = getCookie(res.headers['set-cookie'], 'access-token');
				expect(token1).to.be.a('string');
				done();
			});
	});

	*/
});

function getCookie(headers, id) {
	for (var i = 0; i < headers.length; i++) {
		var kv = headers[i].split(';')[0].split('=');
		if (kv[0] === id) {
			return kv[1];
		}
	}
	return null;
}
