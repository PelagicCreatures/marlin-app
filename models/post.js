const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

	const CMSPost = sequelize.define('CMSPost', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		head: {
			type: Sequelize.STRING(128),
			allowNull: false,
			len: [0, 128]
		},
		subHead: {
			type: Sequelize.STRING(512),
			allowNull: true,
			len: [0, 512],
			ADMIN: {
				inputType: 'textarea'
			}
		},
		authorId: {
			type: Sequelize.INTEGER,
			references: {
				model: "User",
				key: "id"
			},
			ADMIN: {
				selectRelated: {
					order: [
						['username', 'ASC']
					]
				}
			}
		},
		body: {
			type: Sequelize.TEXT,
			ADMIN: {
				inputType: 'markdown'
			}
		},
		photo: {
			type: Sequelize.STRING(512),
			ADMIN: {
				inputType: 'image',
				accepts: 'image/*'
			}
		},
		published: {
			type: Sequelize.BOOLEAN
		},
		pubDate: {
			type: Sequelize.DATE
		},
		unPubDate: {
			type: Sequelize.DATE
		},
		SEOTitle: {
			type: Sequelize.STRING(128),
			len: [0, 128]
		},
		SEODescription: {
			type: Sequelize.STRING(512),
			len: [0, 512],
			ADMIN: {
				inputType: 'textarea'
			}
		}
	}, {
		ADMIN: {
			behavior: 'parent',
			listColumns: ['head', 'published', 'pubDate', 'unPubDate'],
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

	CMSPost.associate = function (models) {
		CMSPost.hasMany(models.CMSPostPhoto, {
			foreignKey: 'postId'
		});

		CMSPost.belongsToMany(models.CMSPostCategory, {
			through: 'CMSPostCategoryJoin',
			foreignKey: 'postId'
		});
	};

	return CMSPost;
};
