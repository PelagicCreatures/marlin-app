'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Role', [{
      description: 'superuser',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      description: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      description: 'registered',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Role', null, {});
  }
};
