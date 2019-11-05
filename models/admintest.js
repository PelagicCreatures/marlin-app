const Sequelize = require('sequelize');
const admin = require('../lib/admin');

module.exports = (sequelize, DataTypes) => {

	const AdminTest = sequelize.define('AdminTest', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		textcolumn: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true,
			isAlpha: true,
			ADMIN: {
				label: 'my label',
				maxLength: 80,
				inputClass: admin.types.text
			}
		},
		textareacolumn: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		}
	}, {
		modelName: 'admintest'
	});

	return AdminTest;
};
