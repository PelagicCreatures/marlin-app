const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

	const AdminTestChildChild = sequelize.define('AdminTestChildChild', {
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
			behavior: 'child',
			hidden: true,
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

	AdminTestChildChild.associate = function (models) {
		AdminTestChildChild.belongsTo(models.AdminTestChild, {
			foreignKey: 'childId'
		});
	}

	return AdminTestChildChild;
};
