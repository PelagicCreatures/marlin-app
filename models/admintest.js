const Sequelize = require('sequelize');

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
			unique: true
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
