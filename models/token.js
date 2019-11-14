const debug = require('debug')('antisocial-db');
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  const Token = sequelize.define('Token', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      hidden: true,
      is: ['^[a-zA-Z0-9]', ''],
      len: [64, 64]
    },
    ttl: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    expires: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    lastaccess: {
      type: Sequelize.DATE
    },
    type: {
      type: Sequelize.STRING
    },
    ip: {
      type: Sequelize.STRING
    }
  }, {
    ADMIN: {
      hidden: true,
      defaultColumn: 'lastaccess',
      listColumns: ['type', 'ip', 'lastaccess'],
      parent: {
        table: 'User',
        fk: 'userId'
      },
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

  Token.associate = function (models) {
    Token.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return Token;
};
