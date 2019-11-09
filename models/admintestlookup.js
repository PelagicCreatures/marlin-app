const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

	const AdminTestLookup = sequelize.define('AdminTestLookup', {
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
		timestamps: true,
		ADMIN: {
			defaultColumn: 'description'
		}
	});

	AdminTestLookup.associate = function (models) {
		AdminTestLookup.hasMany(models.AdminTest, {
			foreignKey: 'lookupId'
		});
	};

	return AdminTestLookup;
};
