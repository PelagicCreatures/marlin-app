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
      len: [0, 60]
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      len: [4, 20],
      is: ['^[a-zA-Z0-9-]+$', '']
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      isEmail: true
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
      allowNull: true,
      isEmail: true
    }
  }, {
    ADMIN: {
      defaultColumn: 'email',
      listColumns: ['email', 'username', 'validated'],
      searchColumns: ['email']
    }
  });

  const UserRole = sequelize.define('UserRole', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,
      ADMIN: {
        hidden: true
      }
    }
  }, {
    timestamps: false,
    ADMIN: {
      parent: {
        table: 'User',
        fk: 'userId'
      }
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
