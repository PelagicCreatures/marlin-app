/*
	scan sequelize models to set up options for editing db rows in web forms

	this mounts a UI on MOUNTPOINT (default /admin) with routes for:
		Listing rows in a table /admin/sometable
		Viewing columns in a row /admin/sometable/xxx
		Creating a row /admin/sometable/create
		Editing a row /admin/sometable/edit

	these forms use API routes
		POST
		PUT
		DELETE

	All of these routes require the logged in user be in role 'superuser' or 'admin'
	by default. Finer access control can be achieved using ACL definition in the data
	models.

	Data types are mapped to javascript classes which handle complex UI form creation
	and data manipulation like image upload where images arestored in public folder,
	and metadata stored in database.

	options on table level:

	ADMIN: {
		defaultColumn: ''
		listColumns: [],
		viewColumns: [],
		editColumns: [],
		searchColumns: [],
		ACL: [{
			permission: 'deny',
			roles: ['*'],
			actions: ['*']
		}, {
			permission: 'allow',
			roles: ['admin', 'superuser'],
			actions: ['create', 'view', 'edit', 'delete']
		}]
	}

	options on column level:

	ADMIN: {
		label:
		inputType:
		hidden: true|false

		// for uploadable types (images and binaries)
		accepts: "image/*"

		// for images
		sendResized: true:false (resize image on client side before transmitting)
		maxWidth:
		maxHeight:

		// for references
		selectRelated: { order: [['description', 'ASC']] }

	}

	TODO: hide delete from UI if row has references
	TODO: optimize prepare for list (cache with a prepare id?)
	TODO: better UI for through models (list of options with checkboxes)
	TODO: related lookup mode for related tables with many rows
	TODO: limit include of related rows for large data sets
	TODO: don't assume row primary key is 'id'

*/

const debug = require('debug')('antisocial-admin');
const VError = require('verror').VError;
const pug = require('pug');
const EventEmitter = require('events');
const express = require('express');
const _ = require('lodash');
const async = require('async');
const mime = require('mime/lite');
const fs = require('fs');
const path = require('path');
const Op = require('sequelize').Op;

const validationKeys = ['is', 'not', 'isEmail', 'isUrl', 'isIP', 'isIPv4', 'isIPv6', 'isAlpha', 'isAlphanumeric', 'isNumeric', 'isInt', 'isFloat', 'isDecimal', 'isLowercase', 'isUppercase', 'notNull', 'isNull', 'notEmpty', 'equals', 'contains', 'notIn', 'isIn', 'notContains', 'len', 'isUUID', 'isDate', 'isAfter', 'isBefore', 'max', 'min', 'isCreditCard'];
let expressApp = null;

let adminTables = {};
let associationsMap = {};

let UPLOAD_PATH = '';
let UPLOAD_URI_PREFIX = '';
let ITEMS_PER_PAGE = 20;
let MOUNTPOINT = '';

const {
	getUserForRequestMiddleware
} = require('../modules/antisocial-users/lib/get-user-for-request-middleware');

function ensureRoleMiddleware(req, res, next) {
	if (!req.antisocialUser) {
		return next(new VError('You must be logged in as an admin user'));
	}

	if (req.isAdmin || req.isSuperUser) {
		return next();
	}

	next(new VError('You must be logged in as an admin user'));
}

function mount(app, db, options) {
	let router = express.Router();

	expressApp = app;

	let userForRequestMiddleware = getUserForRequestMiddleware({
		db: db
	});

	UPLOAD_PATH = path.join(__dirname, '../public', options.UPLOAD_PATH);
	UPLOAD_URI_PREFIX = options.UPLOAD_PATH;
	MOUNTPOINT = options.MOUNTPOINT ? options.MOUNTPOINT : '/admin';

	async function getDependants(modelName, instance) {
		let references = {}
		let assoc = associationsMap[modelName] ? associationsMap[modelName].dependants : [];

		let statsPromises = assoc.map(async reference => {
			let t = Object.keys(reference)[0];
			let fk = reference[t];
			return db.tableDefs[t].findAndCountAll({
				where: {
					[fk]: instance.id
				},
				limit: 10
			});
		});

		let stats = await Promise.all(statsPromises);

		let result = {}
		for (let i = 0; i < assoc.length; i++) {
			let reference = assoc[i];
			let t = Object.keys(reference)[0];
			result[t] = {
				table: t,
				fk: reference[t],
				rows: stats[i]
			};
		}
		return result;
	}

	async function getReferences(modelName, instance) {
		let references = {}
		let assoc = associationsMap[modelName] ? associationsMap[modelName].references : [];

		let statsPromises = assoc.map(async reference => {
			let t = Object.keys(reference)[0];
			let fk = reference[t];
			return db.tableDefs[t].findAndCountAll({
				where: {
					[fk]: instance.id
				},
				limit: 10
			});
		});

		let stats = await Promise.all(statsPromises);

		let result = {}
		for (let i = 0; i < assoc.length; i++) {
			let reference = assoc[i];
			let t = Object.keys(reference)[0];
			result[t] = {
				table: t,
				fk: reference[t],
				rows: stats[i]
			};
		}
		return result;
	}

	debug('mounting admin /menu')
	router.get('/menu', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {

		let tables = []
		for (table in adminTables) {
			if (!adminTables[table].options.hidden) {
				if (db.checkPermission(table, req.antisocialUser, 'view')) {
					tables.push(adminTables[table].name);
				}
			}
		}

		res.render('admin/menu', {
			tables: tables
		});
	});

	// list rows
	debug('mounting admin /table')
	router.get('/:table', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;
		let admin = adminTables[table];
		if (!adminTables[table]) {
			return res.status(404).send('admin for ' + table + ' not defined');
		}

		if (!db.checkPermission(table, req.antisocialUser, 'view')) {
			return res.status(401).send('you don\'t have permission to view ' + table);
		}

		let page = req.query.p ? parseInt(req.query.p) : 1;

		let query = {}
		query.limit = ITEMS_PER_PAGE;
		query.offset = (page - 1) * ITEMS_PER_PAGE;

		// searching
		if (req.query.q) {
			let searchCol = req.query.property;
			query.where = {
				[searchCol]: {
					[Op.like]: req.query.q + '%'
				}
			}
		}

		db.getInstances(table, query, (err, rows, count) => {
			if (err) {
				return res.status(500).send('error: ' + err.message);
			}

			let pages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

			let pagination = {
				count: count,
				pages: pages,
				page: page,
				next: page < pages ? page + 1 : page,
				prev: page > 1 ? page - 1 : 1,
				uri: '?q=' + (req.q ? encodeURIComponent(req.q) : '') + '&property=' + (req.query.property ? encodeURIComponent(req.query.property) : '')
			}

			async.map(rows, (row, cb) => {
				admin.prepare(row, cb);
			}, (err) => {
				res.render('admin/list', {
					admin: admin,
					rows: rows,
					q: req.query.q,
					pagination: pagination,
					mountpoint: options.MOUNTPOINT
				});
			});
		});
	});

	// new row
	debug('mounting admin /:table/create')
	router.get('/:table/create', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;

		let admin = adminTables[table];
		if (!adminTables[table]) {
			return res.status(404).send('admin for ' + table + ' not defined');
		}

		if (!db.checkPermission(table, req.antisocialUser, 'create')) {
			return res.status(401).send('you don\'t have permission to create ' + table);
		}

		admin.prepare(null, (err) => {
			res.render('admin/create', {
				admin: admin,
				mountpoint: options.MOUNTPOINT,
				fk: req.query.fk,
				belongsTo: req.query['belongs-to']
			});
		});
	});

	// view row
	debug('mounting admin /:table/:rowId')
	router.get('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;
		let id = parseInt(req.params.rowId);

		let admin = adminTables[table];
		if (!adminTables[table]) {
			return res.status(404).send('admin for ' + table + ' not defined');
		}

		if (!db.checkPermission(table, req.antisocialUser, 'view')) {
			return res.status(401).send('you don\'t have permission to view ' + table);
		}

		let query = {
			where: {
				id: id
			}
		};

		joins = {};
		for (let rel in admin.associations) {
			if (!query.include) {
				query.include = [];
			}
			if (admin.associations[rel].through) {
				joins[admin.associations[rel].as] = {
					through: admin.associations[rel].through,
					foreignKey: admin.associations[rel].foreignKey,
					foreignIdentifier: admin.associations[rel].foreignIdentifier
				}
			}
			query.include.push(admin.associations[rel].as);
		}

		db.getInstances(table, query, async(err, rows) => {
			if (err) {
				return res.status(500).send('error: ' + err.message);
			}

			if (!rows || !rows.length) {
				return res.status(404).send('error: row not found in ' + table);
			}

			let refs = await getReferences(table, rows[0]);
			let deps = await getDependants(table, rows[0]);

			async.each(joins, function (join, cb) {
				let q = {
					where: {}
				};
				q.where[join.foreignKey] = rows[0].id;
				db.getInstances(join.through, q, (err, joinRows) => {
					join.rows = joinRows;
					cb(err);
				});
			}, function (err) {

				// match rows in through models to target rows
				for (join in joins) {
					if (joins[join].rows) {
						for (let i = 0; i < joins[join].rows.length; i++) {
							let joinRow = joins[join].rows[i];
							for (let j = 0; j < rows[0][join].length; j++) {
								let relRow = rows[0][join][j];
								fi = joins[join].foreignIdentifier;
								if (joinRow[fi] === relRow.id) {
									relRow.ADMIN = {
										through: joins[join].through,
										id: joinRow.id
									}
								}
							}
						}
					}
				}

				admin.prepare(rows[0], (err) => {
					res.render('admin/view', {
						admin: admin,
						row: rows[0],
						mountpoint: options.MOUNTPOINT,
						adminTables: adminTables,
						joins: joins,
						references: refs,
						dependants: deps
					});
				});
			})
		});
	});

	// edit row form
	debug('mounting admin /:table/:rowId/edit')
	router.get('/:table/:rowId/edit', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;
		let id = parseInt(req.params.rowId);

		let admin = adminTables[table];
		if (!adminTables[table]) {
			return res.status(404).send('admin for ' + table + ' not defined');
		}

		if (!db.checkPermission(table, req.antisocialUser, 'edit')) {
			return res.status(401).send('you don\'t have permission to edit ' + table);
		}

		db.getInstances(table, {
			where: {
				id: id
			}
		}, (err, rows) => {
			if (err) {
				return res.status(500).send('error: ' + err.message);
			}

			admin.prepare(rows[0], (err) => {
				res.render('admin/edit', {
					admin: admin,
					row: rows[0],
					mountpoint: options.MOUNTPOINT
				});
			});
		});
	});

	// create a row
	debug('mounting admin POST /:table')
	router.post('/:table', express.json({
		limit: '20mb'
	}), userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;

		let admin = adminTables[table];
		if (!adminTables[table]) {
			return res.status(404).send('admin for ' + table + ' not defined');
		}

		if (!db.checkPermission(table, req.antisocialUser, 'create')) {
			return res.status(401).send('you don\'t have permission to create ' + table);
		}

		app.db.newInstance(table, req.body[table], function (err, instance) {
			if (err) {
				return res.send({
					status: 'error',
					flashLevel: 'danger',
					flashMessage: 'Error creating row',
					errors: [err.message]
				});
			}

			admin.handleUpdate(instance, req.body[table], (err, dirty) => {
				if (err) {
					return res.send({
						status: 'error',
						flashLevel: 'danger',
						flashMessage: 'Error doing admin handleUpdate',
						errors: [err.message]
					});
				}

				if (Object.keys(dirty).length === 0) {
					return res.send({
						status: 'ok',
						flashLevel: 'info',
						flashMessage: 'created',
						id: instance.id
					});
				}

				app.db.updateInstance(table, instance.id, dirty, function (err, instance) {
					if (err) {
						return res.send({
							status: 'error',
							flashLevel: 'danger',
							flashMessage: 'Error saving row after admin handleUpdate',
							errors: [err.message]
						});
					}

					return res.send({
						status: 'ok',
						flashLevel: 'info',
						flashMessage: 'created',
						id: instance.id
					});
				});
			})
		});
	});

	// update a row
	debug('mounting admin PUT /:table/:rowId')
	router.put('/:table/:rowId', express.json({
		limit: '20mb'
	}), userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;
		let id = req.params.rowId;

		let admin = adminTables[table];
		if (!adminTables[table]) {
			return res.status(404).send('admin for ' + table + ' not defined');
		}

		if (!db.checkPermission(table, req.antisocialUser, 'edit')) {
			return res.status(401).send('you don\'t have permission to edit ' + table);
		}

		app.db.updateInstance(table, id, req.body[table], function (err, instance) {
			if (err) {
				return res.send({
					status: 'error',
					flashLevel: 'danger',
					flashMessage: 'Error saving row',
					errors: [err.message]
				});
			}

			admin.handleUpdate(instance, req.body[table], (err, dirty) => {
				if (err) {
					return res.send({
						status: 'error',
						flashLevel: 'danger',
						flashMessage: 'Error doing admin handleUpdate',
						errors: [err.message]
					});
				}

				if (Object.keys(dirty).length === 0) {
					return res.send({
						status: 'ok',
						flashLevel: 'info',
						flashMessage: 'saved'
					});
				}

				app.db.updateInstance(table, instance.id, dirty, function (err, instance) {
					if (err) {
						return res.send({
							status: 'error',
							flashLevel: 'danger',
							flashMessage: 'Error saving row after admin handleUpdate',
							errors: [err.message]
						});
					}

					return res.send({
						status: 'ok',
						flashLevel: 'info',
						flashMessage: 'saved'
					});
				});
			});
		});
	});

	// delete a row
	debug('mounting admin DELETE /:table/:rowId')
	router.delete('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;
		let id = req.params.rowId;

		let admin = adminTables[table];
		if (!adminTables[table]) {
			return res.status(404).send('admin for ' + table + ' not defined');
		}

		if (!db.checkPermission(table, req.antisocialUser, 'delete')) {
			return res.status(401).send('you don\'t have permission to delete ' + table);
		}

		async.waterfall([
			// read  row
			(cb) => {
				db.getInstances(table, {
					where: {
						id: id
					}
				}, (err, rows) => {
					if (err) {
						return cb(new VError(err, 'error reading row'));
					}
					if (!rows.length) {
						return cb(new VError('row not found'))
					}
					cb(null, rows[0]);
				})
			},
			// give admin a chance to cleanup images, etc.
			(instance, cb) => {
				admin.handleDelete(instance, (err) => {
					if (err) {
						return cb(new VError(err, 'admin handleDelete failed'));
					}
					cb(null, instance);
				})
			},
			// delete the row
			(instance, cb) => {
				app.db.deleteInstance(table, id, function (err, instance) {
					if (err) {
						return cb(new VError(err, 'deleteInstance error'));
					}
					cb();
				})
			}
		], (err) => {

			if (err) {
				return res.send({
					status: 'error',
					flashLevel: 'danger',
					flashMessage: 'Error deleting row',
					errors: [err.message]
				});
			}

			return res.send({
				status: 'ok',
				flashLevel: 'info',
				flashMessage: 'deleted'
			});
		});
	});

	debug('mounting admin on %s', options.MOUNTPOINT);

	app.use(options.MOUNTPOINT, router);
}

function mapAssociation(name, type, details) {
	if (!associationsMap[name]) {
		associationsMap[name] = {
			dependants: [],
			references: []
		}
	}
	associationsMap[name][type].push(details);
}

class adminTable extends EventEmitter {

	constructor(app, model) {
		debug('adminTable create %s', model.name);
		super();

		this.app = app;
		this.name = model.tableName;
		this.options = model.options && model.options.ADMIN ? JSON.parse(JSON.stringify(model.options.ADMIN)) : {};
		this.model = model;
		this.columns = {};
		this.associations = {};
		this.build();

		adminTables[model.tableName] = this;
	}

	getOptions() {
		let allOptions = JSON.parse(JSON.stringify(this.options));
		allOptions.associations = JSON.parse(JSON.stringify(this.associations));
		allOptions.columns = {};
		for (let column in this.columns) {
			allOptions.columns[column] = JSON.parse(JSON.stringify(this.columns[column].options));
		}
		return allOptions;
	}

	getValidations() {
		let validations = {};
		for (let column in this.columns) {
			validations[column] = JSON.parse(JSON.stringify(this.columns[column].options.validate));
		}
		return validations;
	}

	build() {

		let buildListColumns = false;
		let buildViewColumns = false;
		let buildEditColumns = false;

		let foreignKeys = {};

		if (!this.options.listColumns) {
			buildListColumns = true;
			this.options.listColumns = [];
		}

		if (!this.options.viewColumns) {
			buildViewColumns = true;
			this.options.viewColumns = [];
		}

		if (!this.options.editColumns) {
			buildEditColumns = true;
			this.options.editColumns = [];
		}

		if (!this.options.searchColumns) {
			this.options.searchColumns = [];
			if (this.options.defaultColumn) {
				this.options.searchColumns.push(this.options.defaultColumn);
			}
		}

		for (let assoc in this.model.associations) {
			let relationship = this.model.associations[assoc];
			let type = relationship.constructor.name;

			if (type === 'HasOne') {
				mapAssociation(this.name, 'dependants', {
					[relationship.target.name]: relationship.foreignKey
				});
			}
			if (type === 'HasMany') {
				mapAssociation(this.name, 'dependants', {
					[relationship.target.name]: relationship.foreignKey
				});
			}
			if (type === 'BelongsTo') {
				mapAssociation(this.name, 'references', {
					[relationship.target.name]: relationship.foreignKey
				});
			}
			if (type === 'BelongsToMany' && relationship.throughModel) {
				mapAssociation(this.name, 'dependants', {
					[relationship.throughModel.name]: relationship.foreignKey
				});
			}

			this.associations[this.model.name + '.' + assoc] = {
				relationship: relationship.constructor.name,
				as: relationship.as,
				target: relationship.target.name,
				targetKey: relationship.targetKey,
				through: relationship.throughModel ? relationship.throughModel.tableName : null,
				foreignKey: relationship.foreignKey,
				foreignIdentifier: relationship.foreignIdentifier
			}

			if (relationship.target.name !== this.model.name) {
				foreignKeys[relationship.foreignKey] = relationship.target.name;
			}
		}

		this.options.foreignKeys = foreignKeys;

		for (let col in this.model.fieldRawAttributesMap) {

			let attr = this.model.tableAttributes[col];
			let adminOptions = {};

			adminOptions.type = attr.type.constructor.name;
			adminOptions.inputType = 'text';

			if (attr.references) {
				mapAssociation(attr.references.model, 'references', {
					[this.name]: col
				});
				adminOptions.references = attr.references;
				adminOptions.inputType = 'reference'
			}

			if (adminOptions.type === 'TEXT') {
				adminOptions.inputType = 'textarea';
			}

			if (adminOptions.type === 'BOOLEAN') {
				adminOptions.inputType = 'checkbox';
			}

			/*
			if (adminOptions.type === 'DATE') {
				adminOptions.inputType = 'date';
			}
			*/

			adminOptions.label = col;

			adminOptions.id = (col === 'id');

			if (adminOptions.id) {
				adminOptions.hidden = true;
			}

			if (col === 'createdAt' || col === 'updatedAt') {
				adminOptions.readOnly = true;
			}

			if (attr.options) {
				adminOptions.length = attr.options.length;
			}

			adminOptions.validate = {};
			for (let i = 0; i < validationKeys.length; i++) {
				if (attr[validationKeys[i]]) {
					adminOptions.validate[validationKeys[i]] = attr[validationKeys[i]];
				}
			}

			if (!attr.allowNull) {
				adminOptions.validate['notEmpty'] = true;
			}

			// override from ADMIN options in model definition
			if (attr.ADMIN) {
				for (let a in attr.ADMIN) {
					adminOptions[a] = attr.ADMIN[a];
				}
			}

			if (buildListColumns && !adminOptions.hidden) {
				this.options.listColumns.push(col);
			}
			if (buildViewColumns && !adminOptions.hidden) {
				this.options.viewColumns.push(col);
			}
			if (buildEditColumns && !adminOptions.id && !adminOptions.hidden && !adminOptions.readOnly) {
				this.options.editColumns.push(col);
			}

			var adminColumn = new classes[adminOptions.inputType](this, col, adminOptions);
		}

		debug('%s Associations %j', this.model.name, this.associations)
	}

	getColumn(name) {
		return this.columns[name];
	}

	addColumn(column) {
		debug('%s.%s adminOptions: %j', this.model.name, column.name, column.options)


		let isAnAdminColumn = column instanceof adminColumn;
		if (!isAnAdminColumn) {
			throw (new VError('adminTable.addColumn %s, column is not an adminTableColumn', this.name));
			return;
		}

		if (this.getColumn(column.name)) {
			throw (new VError('adminTable.addColumn %s, column %s already defined', this.name, column.name));
			return;
		}

		this.columns[column.name] = column;
	}

	prepare(instance, done) {
		async.each(this.columns, (col, cb) => {
			col.prepare(instance, cb)
		}, (err) => {
			done(err);
		})
	}

	handleUpdate(instance, input, done) {
		let dirty = {};
		async.each(this.columns, (col, cb) => {
			col.handleUpdate(instance, input, dirty, cb)
		}, (err) => {
			done(err, dirty);
		})
	}

	handleDelete(instance, done) {
		async.each(this.columns, (col, cb) => {
			col.handleDelete(instance, cb)
		}, (err) => {
			done(err);
		})
	}
}

class adminColumn extends EventEmitter {
	constructor(table, name, options) {
		super();
		this.name = name;
		this.options = options;
		this.setTable(table);
	}

	setTable(table) {
		this.table = table;
		table.addColumn(this);
	}

	handleUpdate(instance, body, dirty, done) {
		// any actions to perform on save.
		// eg. uploads would save file
		return setImmediate(done);
	}

	handleDelete(instance, done) {
		// any actions to perform on delete.
		// eg. uploads would delete file
		return setImmediate(done);
	}

	prepare(instance, cb) {
		// do async things before getForm
		return setImmediate(cb);
	}

	getForm(instance, options) {
		// return input html for edit and create form
	}

	getDisplayValue(instance, options) {
		return instance[this.name];
	}
}

class adminUploadableColumn extends adminColumn {
	constructor(table, name, options) {
		super(table, name, options);
	}

	handleUpdate(instance, input, dirty, done) {
		// new file data base64 encoded
		let data = input[this.name + '_upload'];
		if (!data) {
			return setImmediate(done);
		}

		let v = instance[this.name] ? instance[this.name] : '{}';
		let metadata = JSON.parse(v);

		let pair = data.split(';base64,');

		if (!pair[1] || !pair[0].match(/^data:/)) {
			return done(new VError('incoming data is not in expected format'))
		}

		let type = pair[0].replace(/^data:/, '');
		let encoded = pair[1];

		let extension = mime.getExtension(type);

		if (!extension) {
			return done(new VError('no extension for mime type; ' + type));
		}

		if (!metadata.version) {
			metadata.version = 0;
		}

		++metadata.version;

		let path = this.table.name + '/' + this.name;
		let filename = path + '/' + instance.id + '-' + metadata.version + '.' + extension;

		async.series([(cb) => {
			fs.mkdir(UPLOAD_PATH + '/' + path, {
				recursive: true
			}, (err) => {
				if (err) {
					return cb(new VError(err, 'error creating directories for path ' + path));
				}
				cb();
			});
		}, (cb) => {
			fs.writeFile(UPLOAD_PATH + '/' + filename, encoded, 'base64', (err) => {
				if (err) {
					return cb(new VError(err, 'error writing file'));
				}
				cb();
			});
		}, (cb) => {
			if (!metadata.filename) {
				return setImmediate(cb);
			}

			fs.unlink(UPLOAD_PATH + '/' + metadata.filename, (err) => {
				if (err) {
					return cb(new VError(err, 'error deleting old file'));
				};
				cb();
			});
		}], (err) => {
			if (err) {
				return done(new VError(err, 'error saving %s.%s', this.table.name, this.name));
			}

			metadata = {
				version: metadata.version,
				filename: filename,
				extension: extension,
				type: type
			}

			dirty[this.name] = JSON.stringify(metadata);

			return done();
		});
	}

	handleDelete(instance, done) {
		let v = instance[this.name] ? instance[this.name] : '{}';
		let metadata = JSON.parse(v);

		if (!metadata.filename) {
			return setImmediate(done);
		}

		fs.unlink(UPLOAD_PATH + '/' + metadata.filename, (err) => {
			if (err) {
				return done(new VError(err, 'error deleting old file'));
			};
			done();
		});
	}

	getDisplayValue(instance, options) {
		let v = instance && instance[this.name] ? instance[this.name] : '{}';
		metadata = JSON.parse(v);
		return JSON.stringify(metadata);
	}

}

class adminImageColumn extends adminUploadableColumn {
	constructor(table, name, options) {
		super(table, name, options);
	}

	handleUpdate(instance, input, dirty, done) {
		let data = input[this.name + '_upload'];
		if (!data) {
			return setImmediate(done);
		}

		super.handleUpdate(instance, input, dirty, (err) => {
			if (err) {
				return done(new VError(err, 'image upload failed'));
			}

			let meta = JSON.parse(dirty[this.name]);
			meta.width = input[this.name + '_width'];
			meta.height = input[this.name + '_height'];
			dirty[this.name] = JSON.stringify(meta);

			done();
		});
	}

	getDisplayValue(instance, options) {
		let v = instance && instance[this.name] ? instance[this.name] : '{}';
		let metadata = JSON.parse(v);
		if (!metadata.filename) {
			return null;
		}
		return '<img src="' + UPLOAD_URI_PREFIX + '/' + metadata.filename + '" width="' + metadata.width + '" height="' + metadata.height + '">';
	}

	getForm(instance, options) {
		let v = instance && instance[this.name] ? instance[this.name] : '{}';
		let metadata = JSON.parse(v);
		let thumb = '';
		if (metadata.filename) {
			thumb = '<img src="' + UPLOAD_URI_PREFIX + '/' + metadata.filename + '" width="' + metadata.width + '" height="' + metadata.height + '">';
		}
		return pug.renderFile(expressApp.get('views') + '/admin/type-image.pug', {
			columnName: this.name,
			name: this.table.name + '[' + this.name + ']',
			uploadName: this.table.name + '[' + this.name + '_upload]',
			widthName: this.table.name + '[' + this.name + '_width]',
			heightName: this.table.name + '[' + this.name + '_height]',
			options: this.options,
			related: this.related,
			value: v,
			metadata: metadata,
			thumb: thumb
		});
	}
}

class adminBinaryColumn extends adminUploadableColumn {
	constructor(table, name, options) {
		super(table, name, options);
	}
}

class adminReferenceColumn extends adminColumn {
	constructor(table, name, options) {
		super(table, name, options);
		this.related = [];
		this.cache = {};
	}

	prepare(instance, done) {
		async.series([
			(cb) => {

				if (!instance) {
					return cb();
				}

				delete this.cache[instance.id];

				if (!instance[this.name]) {
					return cb();
				}

				this.table.app.db.getInstances(this.options.references.model, {
					where: {
						id: instance[this.name]
					}
				}, (err, related) => {
					if (err) {
						return cb(err);
					}
					this.cache[instance.id] = related[0][adminTables[this.options.references.model].options.defaultColumn];
					cb();
				});
			}, (cb) => {
				let query = _.has(this, 'options.selectRelated') ? this.options.selectRelated : {};
				this.table.app.db.getInstances(this.options.references.model, query, (err, related) => {
					if (err) {
						cb(new VError(err, 'Could not build form for column'));
					}

					this.related = related;
					cb()
				});
			}
		], (err) => {
			done(err);
		})
	}

	getForm(instance, options) {
		return pug.renderFile(expressApp.get('views') + '/admin/type-related.pug', {
			name: this.table.name + '[' + this.name + ']',
			value: instance ? instance[this.name] : '',
			options: this.options,
			related: this.related
		});
	}

	getDisplayValue(instance, options) {
		if (!instance) {
			return '';
		}
		if (!instance[this.name]) {
			return '';
		}

		return '<a href="' + MOUNTPOINT + '/' + this.options.references.model + '/' + instance[this.name] + '">' + this.cache[instance.id] + '</a>';
	}
}

class adminTextColumn extends adminColumn {

	constructor(table, name, options) {
		super(table, name, options);
	}

	// default input is type="text"
	getForm(instance, options) {
		return pug.renderFile(expressApp.get('views') + '/admin/type-input.pug', {
			name: this.table.name + '[' + this.name + ']',
			value: instance ? instance[this.name] : '',
			options: this.options
		});
	}
}

class adminTextAreaColumn extends adminColumn {
	constructor(table, name, options) {
		super(table, name, options);
	}

	getForm(instance, options) {
		return pug.renderFile(expressApp.get('views') + '/admin/type-textarea.pug', {
			name: this.table.name + '[' + this.name + ']',
			value: instance ? instance[this.name] : '',
			options: this.options
		});
	}
}

class adminCheckboxColumn extends adminColumn {
	constructor(table, name, options) {
		super(table, name, options);
	}

	getForm(instance, options) {
		return pug.renderFile(expressApp.get('views') + '/admin/type-checkbox.pug', {
			name: this.table.name + '[' + this.name + ']',
			value: instance ? instance[this.name] : '',
			options: this.options
		});
	}
}

var classes = {
	reference: adminReferenceColumn,
	text: adminTextColumn,
	textarea: adminTextAreaColumn,
	image: adminImageColumn,
	binary: adminBinaryColumn,
	checkbox: adminCheckboxColumn
}

function getAdmin(table) {
	return adminTables[table];
}

module.exports = {
	mount: mount,
	adminTable: adminTable,
	getAdmin: getAdmin,
	associationsMap: associationsMap
}
