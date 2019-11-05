const debug = require('debug')('antisocial-admin');
const VError = require('verror').VError;
const pug = require('pug');
const EventEmitter = require('events');
const express = require('express');
const _ = require('lodash');

const validationKeys = ['is', 'not', 'isEmail', 'isUrl', 'isIP', 'isIPv4', 'isIPv6', 'isAlpha', 'isAlphanumeric', 'isNumeric', 'isInt', 'isFloat', 'isDecimal', 'isLowercase', 'isUppercase', 'notNull', 'isNull', 'notEmpty', 'equals', 'contains', 'notIn', 'isIn', 'notContains', 'len', 'isUUID', 'isDate', 'isAfter', 'isBefore', 'max', 'min', 'isCreditCard'];
let expressApp = null;

let adminTables = {};

const {
	getUserForRequestMiddleware
} = require('../modules/antisocial-users/lib/get-user-for-request-middleware');

function ensureRoleMiddleware(req, res, next) {
	if (!req.antisocialUser) {
		return next(new VError('You must be logged in as an admin user'));
	}

	req.antisocialUser.getRoles().then((roles) => {
		for (let i = 0; i < roles.length; i++) {
			if (role.Role().description === 'admin' || role.Role().description === 'superuser') {
				return next();
			}
		}
		return next(); // TODO set up roles on first user create?

		next(new VError('You must be logged in as an admin user'));
	}).catch((err) => {
		next(new VError('Error reading user roles'));
	});

}

function mount(app, db, options) {
	let router = express.Router();

	expressApp = app;

	let userForRequestMiddleware = getUserForRequestMiddleware({
		db: db
	});

	// list rows
	debug('mounting admin /table')
	router.get('/:table', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;
		let admin = adminTables[table];
		if (!adminTables[table]) {
			res.status(404).send('admin for ' + table + ' not defined');
		}

		let page = req.query.p ? req.query.p : 1;

		let query = {}
		query.limit = 30;
		query.skip = (page - 1) * 30;

		// searching
		if (req.query.q) {
			let searchCol = adminTable.options.
			query.where = {
				[searchCol]: {
					$like: req.query.q + '%'
				}
			}
		}

		console.log(query);

		db.getInstances(table, query, (err, rows) => {
			if (err) {
				return res.status(500).send('error: ' + err.message);
			}

			let pages = rows.length ? Math.ceil(rows.length / 30) : 0;
			let pagination = {
				count: rows.length,
				pages: pages,
				page: page,
				next: pages < page ? page + 1 : page,
				prev: page > 1 ? page - 1 : 1,
				uri: '?q=' + encodeURIComponent(req.q) + '&property=' + encodeURIComponent(req.query.property)
			}

			res.render('admin/list', {
				admin: admin,
				rows: rows,
				q: req.query.q,
				pagination: pagination,
				mountpoint: options.MOUNTPOINT
			});
		});
	});

	// new row
	debug('mounting admin /:table/create')
	router.get('/:table/create', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {

	});

	// view row
	debug('mounting admin /:table/:rowId')
	router.get('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;
		let id = parseInt(req.params.rowId);

		let admin = adminTables[table];
		if (!adminTables[table]) {
			res.status(404).send('admin for ' + table + ' not defined');
		}

		db.getInstances(table, {
			where: {
				id: id
			}
		}, (err, rows) => {
			if (err) {
				return res.status(500).send('error: ' + err.message);
			}

			res.render('admin/view', {
				admin: admin,
				row: rows[0],
				mountpoint: options.MOUNTPOINT
			});
		});
	});

	// edit row form
	debug('mounting admin /:table/:rowId/edit')
	router.get('/:table/:rowId/edit', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {
		let table = req.params.table;
		let id = parseInt(req.params.rowId);

		let admin = adminTables[table];
		if (!adminTables[table]) {
			res.status(404).send('admin for ' + table + ' not defined');
		}

		db.getInstances(table, {
			where: {
				id: id
			}
		}, (err, rows) => {
			if (err) {
				return res.status(500).send('error: ' + err.message);
			}

			res.render('admin/edit', {
				admin: admin,
				row: rows[0],
				mountpoint: options.MOUNTPOINT
			});
		});
	});

	// create a row
	debug('mounting admin POST /:table/:rowId')
	router.post('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {

	});

	// update a row
	debug('mounting admin PUT /:table/:rowId')
	router.put('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {

	});

	// delete a row
	debug('mounting admin DELETE /:table/:rowId')
	router.delete('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {

	});

	debug('mounting admin on %s', options.MOUNTPOINT);

	app.use(options.MOUNTPOINT, router);
}

class adminTable extends EventEmitter {

	constructor(app, model) {
		debug('adminTable create %s', model.name);
		super();
		this.name = model.name;
		this.options = model.options.ADMIN ? model.options.ADMIN : {};
		this.model = model;
		this.columns = {};
		this.associations = {};
		this.build();

		adminTables[model.name] = this;
	}

	build() {

		let buildListColumns = false;
		let buildViewColumns = false;
		let buildEditColumns = false;

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

		for (let col in this.model.fieldRawAttributesMap) {
			//console.log('col: name: %s.%s attributes: %j', this.model.name, col, this.model.tableAttributes[col])

			let attr = this.model.tableAttributes[col];
			let adminOptions = {};

			adminOptions.type = attr.type.constructor.name;
			adminOptions.inputType = 'text';

			if (adminOptions.type === 'TEXT') {
				adminOptions.inputType = 'textarea';
			}
			/*
			if (adminOptions.type === 'BOOLEAN') {
				adminOptions.inputType = 'checkbox';
			}
			if (adminOptions.type === 'DATE') {
				adminOptions.inputType = 'date';
			}
			*/

			adminOptions.label = col;

			adminOptions.required = !attr.allowNull;
			adminOptions.id = attr.primaryKey;

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
		for (let assoc in this.model.associations) {
			let relationship = this.model.associations[assoc];
			this.associations[this.model.name + '.' + assoc] = {
				relationship: relationship.constructor.name,
				as: relationship.as,
				source: relationship.source.name,
				sourceKey: relationship.sourceKey,
				target: relationship.target.name,
				targetKey: relationship.targetKey,
				through: relationship.combinedTableName,
				foreignKey: relationship.foreignKey,
				foreignIdentifier: relationship.foreignIdentifier,
			}
		}
		debug('%s Associations %j', this.model.name, this.associations)
	}

	getColumn(name) {
		return this.columns[name];
	}

	addColumn(column) {
		debug('%s.%s adminOptions: %j', this.model.name, column.name, column.adminOptions)


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
}

class adminTextColumn extends adminColumn {

	constructor(table, name, options) {
		super(table, name, options);
		debug('adminTableColumn create');
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

var classes = {
	text: adminTextColumn,
	textarea: adminTextAreaColumn
}

module.exports = {
	mount: mount,
	adminTable: adminTable
}
