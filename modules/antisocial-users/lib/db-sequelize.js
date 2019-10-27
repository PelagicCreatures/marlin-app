const Sequelize = require('sequelize');
const debug = require('debug')('antisocial-db');
const VError = require('verror').VError;

const EventEmitter = require('events');

// instantiate sequelize
// setup hooks to emit emit events for create, delete and update

class dbHandler extends EventEmitter {

	constructor(options) {
		debug('dbHandler create');
		super();
		this.options = options;
		this.tableDefs = {};
		this.sequelize = new Sequelize(options.db, options.user, options.password, {
			host: options.host,
			dialect: 'mysql',
			pool: {
				max: 5,
				min: 0,
				idle: 10000
			},
			define: {
				engine: 'INNODB'
			},
			logging: false
		});

		var self = this;

		this.sequelize.addHook('afterCreate', (model, options) => {
			debug('dbHandler emit db-create');
			self.emit('db-create', model.constructor.name, model);
		});

		this.sequelize.addHook('beforeDestroy', (model, options) => {
			debug('dbHandler emit db-delete');
			self.emit('db-delete', model.constructor.name, model);
		});

		this.sequelize.addHook('afterUpdate', (model, options) => {
			debug('dbHandler emit db-update');
			self.emit('db-update', model.constructor.name, model);
		});
	}

	defineTable(modelName, schema, opts) {
		debug('dbHandler.defineTable %s', modelName);
		this.tableDefs[modelName] = this.sequelize.define(modelName, schema, opts);

		return this.tableDefs[modelName];
	}

	getModel(modelName) {
		return this.tableDefs[modelName];
	}

	sync(modelName) {
		if (modelName) {
			this.tableDefs[modelName].sync();
		}
		else {
			this.sequelize.sync();
		}
	}

	newInstance(modelName, data, cb) {
		debug('dbHandler.newInstance %s', modelName);
		this.tableDefs[modelName].create(data)
			.then(function (instance) {
				cb(null, instance);
			})
			.catch(function (err) {
				cb(new VError(err, 'newInstance error'));
			});
	}

	getInstances(modelName, query, cb) {
		this.tableDefs[modelName].findAll(query)
			.then(function (instances) {
				debug('dbHandler.getInstances %s %j found: %s', modelName, query, instances.length);

				cb(null, instances);
			})
			.catch(function (err) {
				cb(new VError(err, 'getInstances error'));
			});
	}

	updateInstance(modelName, id, patch, cb) {
		debug('dbHandler.updateInstance %s %s', modelName, id);
		this.tableDefs[modelName].findOne({
				where: {
					id: id
				}
			})
			.then(function (instance) {
				for (let prop in patch) {
					instance[prop] = patch[prop];
				}
				instance.save()
					.then(function () {
						cb(null, instance);
					})
					.catch(function (err) {
						cb(new VError(err, 'updateInstance error'));
					});
			})
			.catch(function (err) {
				cb(new VError(err, 'updateInstance error ' + modelName + ' id:' + id + ' not found'));
			});
	}

	deleteInstance(modelName, id, cb) {
		debug('dbHandler.deleteInstance %s %s', modelName, id);
		this.tableDefs[modelName].findOne({
				where: {
					id: id
				}
			})
			.then(function (instance) {
				instance.destroy()
					.then(function () {
						cb();
					})
					.catch(function (err) {
						cb(new VError(err, 'deleteInstance error'));
					});
			})
			.catch(function (err) {
				cb(new VError(err, 'deleteInstance error ' + modelName + ' id:' + id + ' not found'));
			});
	}
}

module.exports = dbHandler;
