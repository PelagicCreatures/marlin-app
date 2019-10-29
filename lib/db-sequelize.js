const debug = require('debug')('antisocial-db');
const VError = require('verror').VError;
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const adminTable = require("./admin").adminTable;

const EventEmitter = require('events');

// instantiate sequelize
// load models
// setup hooks to emit emit events for create, delete and update

class dbHandler extends EventEmitter {

	constructor(options) {
		debug('dbHandler create');

		super();
		this.options = options;
		this.tableDefs = {};

		// the sequelize config file is used for sequelize-cli db:migrate but we don't
		// keep production credentials there - they are passed into this in 'options'
		this.sequelize = new Sequelize(options.db, options.user, options.password, options);

		let modelsPath = path.join(__dirname, '../models');

		// load models in models directory (exclude models/index.js used by sequelize-cli db:migrate)
		fs
			.readdirSync(modelsPath)
			.filter(file => {
				return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
			})
			.forEach(file => {
				const model = this.sequelize['import'](path.join(modelsPath, file));
				this.tableDefs[model.name] = model;
			});

		Object.keys(this.tableDefs).forEach(modelName => {
			if (this.tableDefs[modelName].associate) {
				this.tableDefs[modelName].associate(this.tableDefs);
			}
		});

		this.sequelize.sync();

		for (let model in this.tableDefs) {
			let AdminTable = new adminTable(this.tableDefs[model]);
		}

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
