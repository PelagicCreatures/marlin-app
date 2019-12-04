const debug = require('debug')('antisocial-db');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

	const UserBehavior = sequelize.define('UserBehavior', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		type: {
			type: Sequelize.STRING
		},
		behaviorId: {
			type: Sequelize.UUID,
			defaultValue: Sequelize.UUIDV4
		},
		path: {
			type: Sequelize.STRING(512)
		},
		isLoggedIn: {
			type: Sequelize.BOOLEAN
		},
		hasAccount: {
			type: Sequelize.BOOLEAN
		},
		isSubscriber: {
			type: Sequelize.BOOLEAN
		},
		userId: {
			type: Sequelize.INTEGER
		},
		scale: {
			type: Sequelize.STRING(30)
		},
		ua: {
			type: Sequelize.STRING(512)
		},
		referer: {
			type: Sequelize.STRING(512)
		},
		ip: {
			type: Sequelize.STRING,
			isIP: true
		},
		hostname: {
			type: Sequelize.STRING
		},
		ts: {
			type: Sequelize.INTEGER
		},
		groupByHr: {
			type: Sequelize.INTEGER
		}

	}, {});

	return UserBehavior;
};
