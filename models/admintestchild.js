const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

	const AdminTestChild = sequelize.define('AdminTestChild', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		description: {
			type: Sequelize.STRING(80),
			allowNull: false
		}
	}, {
		timestamps: false,
		ADMIN: {
			ACL: [{
				permission: 'deny',
				roles: ['*'],
				actions: ['*']
			}, {
				permission: 'allow',
				roles: ['superuser'],
				actions: ['create', 'view', 'edit', 'delete']
			}]
		}
	});

	AdminTestChild.associate = function (models) {
		AdminTestChild.belongsTo(models.AdminTest, {
			foreignKey: 'testId'
		});
	}

	return AdminTestChild;
};
