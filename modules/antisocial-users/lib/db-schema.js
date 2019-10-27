const Sequelize = require('sequelize');

module.exports = function (db) {
	let User = db.defineTable('users', {
		'id': {
			type: Sequelize.UUID,
			allowNull: false,
			primaryKey: true,
			defaultValue: Sequelize.UUIDV4
		},
		'name': {
			type: Sequelize.STRING,
		},
		'username': {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false
		},
		'email': {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false
		},
		'password': {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false,
		},
		'validated': {
			type: Sequelize.INTEGER
		},
		'stripeCustomer': {
			type: Sequelize.STRING
		},
		'stripeSubscription': {
			type: Sequelize.STRING
		},
		'stripeStatus': {
			type: Sequelize.STRING
		},
		'pendingEmail': {
			type: Sequelize.STRING,
			unique: true,
			allowNull: true
		}
	});

	let Token = db.defineTable('tokens', {
		'id': {
			type: Sequelize.UUID,
			allowNull: false,
			primaryKey: true,
			defaultValue: Sequelize.UUIDV4
		},
		'token': {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false
		},
		'ttl': {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		'lastaccess': {
			type: Sequelize.DATE
		},
		'type': {
			type: Sequelize.STRING
		},
		'ip': {
			type: Sequelize.STRING
		}
	});

	User.hasMany(Token);
	Token.belongsTo(User);

	db.sync();
};
