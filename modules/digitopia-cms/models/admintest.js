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
			len: [1, 10],
			ADMIN: {
				label: 'my label',
				maxLength: 80,
				inputType: 'text',
				notHTML: true
			}
		},
		textareacolumn: {
			type: Sequelize.TEXT,
			allowNull: true,
			ADMIN: {
				inputType: 'markdown',
				maxLength: 2048,
				notHTML: true
			}
		},
		jsoncolumn: {
			type: Sequelize.JSON,
			allowNull: true
		},
		lookupId: {
			type: Sequelize.INTEGER,
			references: {
				model: "AdminTestLookup",
				key: "id"
			},
			ADMIN: {
				selectRelated: {
					order: [
						['description', 'ASC']
					]
				}
			}
		},
		profilePhoto: {
			type: Sequelize.STRING(512),
			ADMIN: {
				inputType: 'image',
				accepts: 'image/*'
			}
		},
		boolean: {
			type: Sequelize.BOOLEAN
		}
	}, {
		ADMIN: {
			behavior: 'parent',
			listColumns: ['textcolumn', 'profilePhoto', 'lookupId'],
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

	AdminTest.associate = function (models) {
		AdminTest.hasMany(models.AdminTestChild, {
			foreignKey: 'testId'
		});

		AdminTest.belongsToMany(models.AdminTestMulti, {
			through: 'MultiJoin',
			foreignKey: 'testId'
		});
	};

	return AdminTest;
};
