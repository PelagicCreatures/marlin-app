var request = require('superagent');
var assert = require('assert');
var expect = require('expect.js');
var uuid = require('uuid');
var async = require('async');

// TODO negative coverage for login, reg, validate etc.

describe('users', function () {
	this.timeout(50000);

	var client1 = request.agent();
	var client2 = request.agent();
	var client3 = request.agent();

	var token1;
	var token2;

	var id2, id1;

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

	it('should not be able to post empty register payload', function (done) {
		client1.post('http://127.0.0.1:3000/api/users/register')
			.type('form')
			.send({
				'email': '',
				'password': '',
				'username': ''
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(res.status).to.equal(422);
				expect(res.body.errors).to.be.an('array');
				done();
			});
	});

	it('should not be able to post invalid register payload', function (done) {
		client1.post('http://127.0.0.1:3000/api/users/register')
			.type('form')
			.send({
				'email': 'invalid email',
				'password': 'test with spaces',
				'username': 'invalid username'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(res.status).to.equal(422);
				expect(res.body.errors).to.be.an('array');
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
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				id1 = res.body.result.id;
				token1 = getCookie(res.headers['set-cookie'], 'access-token');
				expect(token1).to.be.a('string');
				done();
			});
	});

	it('should be able to validate account 1', function (done) {
		app.db.getInstances('tokens', {
			where: {
				'userId': id1,
				'type': 'validate'
			}
		}, function (err, tokenInstances) {
			expect(err).to.be(null);
			expect(tokenInstances).to.be.an('array');
			expect(tokenInstances.length).to.equal(1);

			client1.post('http://127.0.0.1:3000/api/users/email-validate')
				.type('form')
				.send({
					token: tokenInstances[0].token
				}).end(function (err, res) {
					if (err) {
						console.log('errors: %j %j', err, res.body ? res.body : '');
					}
					expect(res.status).to.equal(200);
					expect(res.body.status).to.equal('ok');
					done();
				});
		});
	});

	it('should be able to logout account 1', function (done) {
		client1.get('http://127.0.0.1:3000/api/users/logout')
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
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
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				id2 = res.body.result.id;
				token2 = getCookie(res.headers['set-cookie'], 'access-token');
				expect(token2).to.be.a('string');
				done();
			});
	});

	it('should be able to validate account 2', function (done) {
		app.db.getInstances('tokens', {
			where: {
				'userId': id2,
				'type': 'validate'
			}
		}, function (err, tokenInstances) {
			expect(err).to.be(null);
			expect(tokenInstances).to.be.an('array');
			expect(tokenInstances.length).to.equal(1);

			client2.post('http://127.0.0.1:3000/api/users/email-validate')
				.type('form')
				.send({
					token: tokenInstances[0].token
				})
				.end(function (err, res) {
					if (err) {
						console.log('errors: %j %j', err, res.body ? res.body : '');
					}
					expect(res.status).to.equal(200);
					expect(res.body.status).to.equal('ok');
					done();
				});
		});
	});

	it('should be able to logout account 2', function (done) {
		client2.get('http://127.0.0.1:3000/api/users/logout')
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				done();
			});
	});

	it('should not be able to login account 2 w/bad password', function (done) {
		client2.post('http://127.0.0.1:3000/api/users/login')
			.type('form')
			.send({
				'email': 'mrhodes+2@myantisocial.net',
				'password': 'Testing123bad'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(res.status).to.equal(401);
				done();
			});
	});

	it('should be able to login account 2', function (done) {
		client2.post('http://127.0.0.1:3000/api/users/login')
			.type('form')
			.send({
				'email': 'mrhodes+2@myantisocial.net',
				'password': 'Testing123'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				done();
			});
	});

	it('should be able to send password reset account 1', function (done) {
		client1.post('http://127.0.0.1:3000/api/users/password-reset')
			.type('form')
			.send({
				'email': 'mrhodes+1@myantisocial.net'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				done();
			});
	});

	it('should be able to set new password with token account 1', function (done) {
		app.db.getInstances('tokens', {
			where: {
				'userId': id1,
				'type': 'reset'
			}
		}, function (err, tokenInstances) {
			expect(err).to.be(null);
			expect(tokenInstances).to.be.an('array');
			expect(tokenInstances.length).to.equal(1);

			var resetToken = tokenInstances[0].token;

			client1.post('http://127.0.0.1:3000/api/users/password-set')
				.type('form')
				.send({
					token: resetToken,
					password: 'Testing1234'
				})
				.end(function (err, res) {
					if (err) {
						console.log('errors: %j %j', err, res.body ? res.body : '');
					}
					expect(err).to.be(null);
					expect(res.status).to.equal(200);
					expect(res.body.status).to.equal('ok');
					done();
				});
		});
	});

	it('should be able to log in again account 1 after reset', function (done) {
		client1.post('http://127.0.0.1:3000/api/users/login')
			.type('form')
			.send({
				'email': 'mrhodes+1@myantisocial.net',
				'password': 'Testing1234'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				token1 = getCookie(res.headers['set-cookie'], 'access-token');
				expect(token1).to.be.a('string');
				done();
			});
	});

	it('should be able to change password when logged in', function (done) {
		client1.post('http://127.0.0.1:3000/api/users/password-change')
			.type('form')
			.send({
				'oldpassword': 'Testing1234',
				'password': 'Testing123'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				done();
			});
	});

	it('should be able to change email when logged in', function (done) {
		client1.post('http://127.0.0.1:3000/api/users/email-change')
			.type('form')
			.send({
				'email': 'mrhodes+11@myantisocial.net'
			})
			.end(function (err, res) {
				if (err) {
					console.log('errors: %j %j', err, res.body ? res.body : '');
				}
				expect(err).to.be(null);
				expect(res.status).to.equal(200);
				expect(res.body.status).to.equal('ok');
				done();
			});
	});

	it('should be able to validate account 1 after email change', function (done) {
		app.db.getInstances('tokens', {
			where: {
				'userId': id1,
				'type': 'validate'
			}
		}, function (err, tokenInstances) {
			expect(err).to.be(null);
			expect(tokenInstances).to.be.an('array');
			expect(tokenInstances.length).to.equal(1);

			client1.post('http://127.0.0.1:3000/api/users/email-validate')
				.type('form')
				.send({
					token: tokenInstances[0].token
				}).end(function (err, res) {
					if (err) {
						console.log('errors: %j %j', err, res.body ? res.body : '');
					}
					expect(res.status).to.equal(200);
					expect(res.body.status).to.equal('ok');
					done();
				});
		});
	});
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
