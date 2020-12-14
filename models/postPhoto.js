const Sequelize = require('sequelize')

module.exports = (sequelize, DataTypes) => {
	const CMSPostPhoto = sequelize.define('CMSPostPhoto', {
		id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		description: {
			type: Sequelize.STRING(80),
			allowNull: false
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
		credit: {
			type: Sequelize.STRING(80),
			allowNull: true
		},
		caption: {
			type: Sequelize.STRING(512),
			allowNull: true,
			ADMIN: {
				inputType: 'textarea'
			}
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
				roles: ['superuser', 'admin'],
				actions: ['create', 'view', 'edit', 'delete']
			}]
		}
	})

	CMSPostPhoto.associate = function (models) {
		CMSPostPhoto.belongsTo(models.CMSPost, {
			foreignKey: 'postId'
		})
	}

	return CMSPostPhoto
}
