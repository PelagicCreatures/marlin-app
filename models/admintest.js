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
			type: Sequelize.STRING(80),
			allowNull: false,
			unique: true,
			isAlpha: true,
			ADMIN: {
				label: 'my label',
				maxLength: 80,
				inputType: 'text'
			}
		},
		textareacolumn: {
			type: Sequelize.TEXT,
			allowNull: true,
			unique: true,
			ADMIN: {
				maxLength: 2048,
			}
		}
	}, {
		modelName: 'admintest',
		ADMIN: {
			listColumns: ['textcolumn'],
			searchColumns: ['textcolumn'],
			viewColumns: ['textcolumn', 'textareacolumn'],
			editColumns: ['textcolumn', 'textareacolumn']
		}
	});

	return AdminTest;
};
