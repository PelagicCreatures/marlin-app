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
			ADMIN: {
				maxLength: 2048,
			}
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
		}
	}, {
		ADMIN: {
			defaultColumn: 'textcolumn',
			listColumns: ['textcolumn', 'profilePhoto', 'lookupId']
		}
	});

	return AdminTest;
};
