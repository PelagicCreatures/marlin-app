const debug = require('debug')('antisocial-db');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  const Role = sequelize.define('Role', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
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
        roles: ['superuser'],
        actions: ['create', 'view', 'edit', 'delete']
      }]
    }
  });

  Role.associate = function (models) {
    Role.belongsToMany(models.User, {
      through: 'UserRole',
      foreignKey: 'roleId'
    });
  };

  return Role;
};
