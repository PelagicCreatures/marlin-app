const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

	const CMSPostCategory = sequelize.define('CMSPostCategory', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		nickname: {
			type: Sequelize.STRING(80),
			allowNull: false,
			not: ["/[$&+,\/:;=?@ <>#%{}|\\\^~\[\]`\\\"']/"] // uri special and ambigious char
		},
		description: {
			type: Sequelize.STRING(80),
			allowNull: false
		}
	}, {
		timestamps: false,
		ADMIN: {
			behavior: 'reference',
			ACL: [{
				permission: 'deny',
				roles: ['*'],
				actions: ['*']
			}, {
				permission: 'allow',
				roles: ['superuser', 'admin'],
				actions: ['create', 'view', 'edit', 'delete']
			}]
		}
	});

	CMSPostCategory.associate = function (models) {
		CMSPostCategory.belongsToMany(models.CMSPost, {
			through: 'CMSPostCategoryJoin',
			foreignKey: 'categoryId'
		});
	};

	return CMSPostCategory;
};
