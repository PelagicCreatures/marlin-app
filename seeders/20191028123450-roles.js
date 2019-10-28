'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Role', [{
      description: 'Super User',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      description: 'Admin User',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      description: 'Registered User',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Role', null, {});
  }
};
