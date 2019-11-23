const debug = require('debug')('antisocial-db');
const VError = require('verror').VError;
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const basename = path.basename(__filename);
const admin = require("./admin");
const _ = require('lodash');
const async = require('async');

const EventEmitter = require('events');
let modelDefs = [];

// instantiate sequelize
// load models
// setup hooks to emit emit events for create, delete and update

class dbHandler extends EventEmitter {

	constructor(app, options) {
		debug('dbHandler create');

		super();
		this.app = app;
		this.options = options;

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
				let modelDef = this.sequelize['import'](path.join(modelsPath, file));
				modelDefs[modelDef.name] = modelDef;
			});


		Object.keys(modelDefs).forEach(modelName => {
			if (modelDefs[modelName].associate) {
				modelDefs[modelName].associate(modelDefs);
			}
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

	sync(done) {
		debug('calling sequelize.sync()');
		this.sequelize.sync().then(() => {

			if (this.options.ADMIN) {
				// create admin for models defined in /models skipping auto generated join tables
				for (let model in modelDefs) {
					let AdminTable = new admin.adminTable(this.app, this.sequelize.models[model]);
				}
			}

			debug('sequelize.sync() done associationsMap: %j', admin.associationsMap);

			// if no user roles create superuser and admin
			this.getInstances('Role', {}, (err, roles, count) => {
				if (count) {
					return done();
				}
				async.series([
					(cb) => {
						this.newInstance('Role', {
							description: 'superuser'
						}, cb);
					}, (cb) => {
						this.newInstance('Role', {
							description: 'admin'
						}, cb);
					}
				], function (err) {
					if (err) {
						debug('error creating default roles', err);
					}
					debug('default roles created');
					done();
				});
			});
		});
	}

	getModel(modelName) {
		if (!this.sequelize.models[modelName]) {
			throw (new Error('db-sequelize getModel model not found: ' + modelName))
		}
		return this.sequelize.models[modelName];
	}

	newInstance(modelName, data, cb) {
		debug('dbHandler.newInstance %s', modelName);
		for (let prop in data) {
			if (!data[prop]) {
				delete data[prop];
			}
		}
		this.getModel(modelName).create(data)
			.then(function (instance) {
				cb(null, instance);
			})
			.catch(function (err) {
				cb(new VError(err, 'newInstance error'));
			});
	}

	getInstance(modelName, id, cb) {
		this.getModel(modelName).findByPk(id)
			.then(function (result) {
				debug('dbHandler.getInstance %s %s found: %j', modelName, id, result);
				cb(null, result);
			})
			.catch(function (err) {
				cb(new VError(err, 'getInstances error'));
			});
	}

	getInstances(modelName, query, cb) {
		this.getModel(modelName).findAndCountAll(query)
			.then(function (result) {
				debug('dbHandler.getInstances %s %j found: %s', modelName, query, result.rows.length);

				cb(null, result.rows, result.count);
			})
			.catch(function (err) {
				cb(new VError(err, 'getInstances error'));
			});
	}

	updateInstance(modelName, id, patch, cb) {
		debug('dbHandler.updateInstance %s %s %j', modelName, id, patch);
		this.getModel(modelName).findOne({
				where: {
					id: id
				}
			})
			.then(function (instance) {
				for (let prop in patch) {
					instance[prop] = patch[prop] ? patch[prop] : null;
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

	// TODO: if parent behavior, delete all hasMany, and belongsToMany join records

	async doDelete(modelName, instance) {
		return new Promise(async(resolve, reject) => {
			let deps, manyThroughs;
			try {
				deps = await admin.getDependants(modelName, instance);

				// recursively collect all the dependant rows to delete

				let toDelete = [];

				for (let t in deps) {
					let batch = deps[t].rows.rows.map((depInstance) => {
						return this.doDelete(t, depInstance);
					});
					toDelete = toDelete.concat(batch);
				}

				await Promise.all(toDelete);

				instance.destroy().then(resolve).catch(reject);
			}
			catch (err) {
				reject(new VError(err, "error selecting and deleting dependant rows"))
			}
		})
	}

	deleteInstance(modelName, id, cb) {
		debug('dbHandler.deleteInstance %s %s', modelName, id);
		this.getModel(modelName).findOne({
				where: {
					id: id
				}
			})
			.then((instance) => {
				this.doDelete(modelName, instance)
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

	checkPermission(modelName, user, action) {

		let permission = 'deny';

		if (!this.getModel(modelName)) {
			return permission === 'allow';
		}

		let acl = _.get(this.getModel(modelName), 'options.ADMIN.ACL');

		if (!acl) {
			acl = [{
				permission: 'deny',
				roles: ['*'],
				actions: ['*']
			}]
		}

		var userRoles = ['*'];

		if (user.Roles) {
			for (let i = 0; i < user.Roles.length; i++) {
				userRoles.push(user.Roles[i].description);
			}
		}

		for (let i in acl) {
			let rule = acl[i];
			// rule applies to intended action ?
			if (rule.actions.indexOf(action) !== -1 || rule.actions.indexOf('*') !== -1) {
				for (let j in rule.roles) {
					let role = rule.roles[j];
					// rule applies to user's role ?
					if (userRoles.indexOf(role) !== -1) {
						permission = rule.permission;
					}
				}
			}
		}

		return permission === 'allow';
	}
}

module.exports = dbHandler;
