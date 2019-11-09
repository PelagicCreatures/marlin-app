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
      hidden: true
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
      defaultColumn: 'lastaccess',
      listColumns: ['type', 'ip', 'lastaccess'],
      parent: {
        table: 'User',
        fk: 'userId'
      }
    }
  });

  Token.associate = function (models) {
    Token.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return Token;
};
