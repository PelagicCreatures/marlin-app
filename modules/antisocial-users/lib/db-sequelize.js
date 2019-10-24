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

	defineTable(collectionName, schema, opts) {
		debug('dbHandler.defineTable %s', collectionName);
		this.tableDefs[collectionName] = this.sequelize.define(collectionName, schema, opts);
		this.tableDefs[collectionName].sync();
	}

	getTable(collectionName) {
		return this.tableDefs[collectionName];
	}

	newInstance(collectionName, data, cb) {
		debug('dbHandler.newInstance %s', collectionName);
		this.tableDefs[collectionName].create(data)
			.then(function (instance) {
				cb(null, instance);
			})
			.catch(function (err) {
				cb(new VError(err, 'newInstance error'));
			});
	}

	getInstances(collectionName, query, cb) {
		this.tableDefs[collectionName].findAll(query)
			.then(function (instances) {
				debug('dbHandler.getInstances %s %j found: %s', collectionName, query, instances.length);

				cb(null, instances);
			})
			.catch(function (err) {
				cb(new VError(err, 'getInstances error'));
			});
	}

	updateInstance(collectionName, id, patch, cb) {
		debug('dbHandler.updateInstance %s %s', collectionName, id);
		this.tableDefs[collectionName].findOne({
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
				cb(new VError(err, 'updateInstance error ' + collectionName + ' id:' + id + ' not found'));
			});
	}

	deleteInstance(collectionName, id, cb) {
		debug('dbHandler.deleteInstance %s %s', collectionName, id);
		this.tableDefs[collectionName].findOne({
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
				cb(new VError(err, 'deleteInstance error ' + collectionName + ' id:' + id + ' not found'));
			});
	}
}

module.exports = dbHandler;
