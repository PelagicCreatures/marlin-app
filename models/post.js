const Sequelize = require('sequelize')

module.exports = (sequelize, DataTypes) => {
	const CMSPost = sequelize.define('CMSPost', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		uuid: {
			type: Sequelize.UUID,
			defaultValue: Sequelize.UUIDV4,
			ADMIN: {
				hidden: true
			}
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
		postTypeId: {
			type: Sequelize.INTEGER,
			ADMIN: {
				selectRelated: {
					order: [
						['description', 'ASC']
					]
				}
			}
		},
		authorId: {
			type: Sequelize.INTEGER,
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
			type: Sequelize.JSON,
			ADMIN: {
				inputType: 'image',
				accepts: 'image/*'
			}
		},
		googlePhotoId: {
			type: Sequelize.STRING
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
		},
		googlePhotos: {
			type: Sequelize.JSON
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
				roles: ['superuser', 'admin', 'owner'],
				actions: ['create', 'view', 'edit', 'delete']
			}, {
				permission: 'allow',
				roles: ['registered'],
				actions: ['create']
			}]
		}
	})

	CMSPost.associate = function (models) {
		CMSPost.belongsTo(models.CMSPostType, {
			foreignKey: 'postTypeId',
			as: 'PostType'
		})

		CMSPost.belongsTo(models.User, {
			foreignKey: 'authorId',
			as: 'PostAuthor'
		})

		CMSPost.hasMany(models.CMSPostPhoto, {
			foreignKey: 'postId'
		})

		CMSPost.belongsToMany(models.CMSPostCategory, {
			through: 'CMSPostCategoryJoin',
			foreignKey: 'postId'
		})
	}

	return CMSPost
}
