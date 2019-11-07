const debug = require('debug')('antisocial-db');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  const User = sequelize.define('User', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      ADMIN: {
        hidden: true
      }
    },
    validated: {
      type: Sequelize.INTEGER
    },
    stripeCustomer: {
      type: Sequelize.STRING
    },
    stripeSubscription: {
      type: Sequelize.STRING
    },
    stripeStatus: {
      type: Sequelize.STRING
    },
    pendingEmail: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    }
  }, {
    modelName: 'user',
    ADMIN: {
      defaultColumn: 'email',
      listColumns: ['email', 'username', 'validated'],
      searchColumns: ['email'],
    }
  });

  User.associate = function (models) {
    User.hasMany(models.Token, {
      foreignKey: 'userId'
    });
    User.belongsToMany(models.Role, {
      through: 'UserRole',
      foreignKey: 'userId'
    });
  };

  return User;
};
