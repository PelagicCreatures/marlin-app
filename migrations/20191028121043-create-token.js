'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Token', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      token: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
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
      },
      userId: {
        type: Sequelize.INTEGER,
        unique: false,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Token');
  }
};
