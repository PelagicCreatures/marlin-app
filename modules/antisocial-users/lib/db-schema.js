module.exports = function (db) {
	db.defineTable('users', {
		'id': {
			type: 'id',
			mySQLOpts: ['NOT NULL', 'PRIMARY KEY']
		},
		'name': {
			type: 'string'
		},
		'username': {
			type: 'string',
			mySQLOpts: ['NOT NULL', 'UNIQUE KEY']
		},
		'email': {
			type: 'string',
			mySQLOpts: ['NOT NULL', 'UNIQUE KEY']
		},
		'password': {
			type: 'string',
			mySQLOpts: ['NOT NULL']
		},
		'validated': {
			type: 'boolean'
		},
		'created': {
			type: 'datetime'
		},
		'stripeCustomer': {
			type: 'string'
		},
		'stripeSubscription': {
			type: 'string'
		},
		'stripeStatus': {
			type: 'string'
		},
		'pendingEmail': {
			type: 'string',
			mySQLOpts: ['NOT NULL', 'UNIQUE KEY']
		}
	}, [
		'ENGINE=InnoDB',
		'DEFAULT CHARSET=utf8'
	]);

	db.defineTable('tokens', {
		'id': {
			type: 'id',
			mySQLOpts: ['NOT NULL', 'PRIMARY KEY']
		},
		'userId': {
			type: 'id',
			mySQLOpts: ['NOT NULL']
		},
		'token': {
			type: 'token',
			mySQLOpts: ['NOT NULL', 'UNIQUE KEY']
		},
		'ttl': {
			type: 'string',
			mySQLType: 'int',
			mySQLOpts: ['NOT NULL']
		},
		'created': {
			type: 'datetime'
		},
		'lastaccess': {
			type: 'datetime'
		}
	}, [
		'ENGINE=InnoDB',
		'DEFAULT CHARSET=utf8'
	]);

	//console.log(db.getCreateTable('users'));
	//console.log(db.getCreateTable('tokens'));
};
