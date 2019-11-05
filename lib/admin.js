const debug = require('debug')('antisocial-admin');
const VError = require('verror').VError;
const pug = require('pug');
const EventEmitter = require('events');
const express = require('express');
const _ = require('lodash');

const validationKeys = ['is', 'not', 'isEmail', 'isUrl', 'isIP', 'isIPv4', 'isIPv6', 'isAlpha', 'isAlphanumeric', 'isNumeric', 'isInt', 'isFloat', 'isDecimal', 'isLowercase', 'isUppercase', 'notNull', 'isNull', 'notEmpty', 'equals', 'contains', 'notIn', 'isIn', 'notContains', 'len', 'isUUID', 'isDate', 'isAfter', 'isBefore', 'max', 'min', 'isCreditCard'];

const {
	getUserForRequestMiddleware
} = require('../modules/antisocial-users/lib/get-user-for-request-middleware');

function ensureRoleMiddleware(req, res, next) {
	if (!req.antisocialUser) {
		return next(new VError('You must be logged in as an admin user'));
	}

	var roles = req.antisocialUser.Roles();
	for (let i = 0; i < roles.length; i++) {
		if (role.Role().description === 'admin' || role.Role().description === 'superuser') {
			return next();
		}
	}

	next(new VError('You must be logged in as an admin user'));
}

function mount(app, options) {
	let router = express.Router();

	let userForRequestMiddleware = getUserForRequestMiddleware({
		db: app.db
	});

	// list rows
	debug('mounting admin /table[/page]')
	router.get(/^\/([^/]+)(\/([\d]+))?$/, userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {});

	// new row
	debug('mounting admin /:table/create')
	router.get('/:table/create', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {});

	// view row
	debug('mounting admin /:table/:rowId/view')
	router.get('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {});

	// edit row form
	debug('mounting admin /:table/:rowId/edit')
	router.get('/:table/:rowId/edit', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {});

	// create a row
	debug('mounting admin POST /:table/:rowId')
	router.post('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {});

	// update a row
	debug('mounting admin PUT /:table/:rowId')
	router.put('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {});

	// delete a row
	debug('mounting admin DELETE /:table/:rowId')
	router.delete('/:table/:rowId', userForRequestMiddleware, ensureRoleMiddleware, function (req, res) {});

	debug('mounting admin on %s', options.MOUNTPOINT);

	app.use(options.MOUNTPOINT, router);
}

class adminTable extends EventEmitter {

	constructor(app, model, options) {
		debug('adminTable create %s', model.name);
		super();
		this.app = app;
		this.name = model.name;
		this.options = options;
		this.model = model;
		this.columns = [];
		this.associations = {};
		this.build();
	}

	build() {
		for (let col in this.model.fieldRawAttributesMap) {
			//console.log('col: name: %s.%s attributes: %j', this.model.name, col, this.model.tableAttributes[col])

			let attr = this.model.tableAttributes[col];
			let adminOptions = {};

			adminOptions.type = attr.type.constructor.name;
			adminOptions.inputType = 'text';

			if (adminOptions.type === 'TEXT') {
				adminOptions.inputType = 'textarea';
			}
			if (adminOptions.type === 'BOOLEAN') {
				adminOptions.inputType = 'checkbox';
			}
			if (adminOptions.type === 'DATE') {
				adminOptions.inputType = 'date';
			}

			adminOptions.required = attr.allowNull;
			adminOptions.id = attr.primaryKey;

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
			debug('%s.%s adminOptions: %j', this.model.name, col, adminOptions)
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
		for (let i = 0; i < this.columns.length; i++) {
			if (this.columns[i].name == name) {
				return this.columns[i];
			}
		}
		return null;
	}

	addColumn(column) {
		let isAnAdminColumn = column instanceof adminTableColumn;
		if (!isAnAdminColumn) {
			throw (new VError('adminTable.addColumn %s, column is not an adminTableColumn', this.name));
			return;
		}

		if (getColumn(column.name)) {
			throw (new VError('adminTable.addColumn %s, column %s already defined', this.name, column.name));
			return;
		}

		columns[column.name] = column;
	}
}

class adminTextColumn extends EventEmitter {

	constructor(table, name, options) {
		debug('adminTableColumn create');
		this.name = name;
		this.options = options;
		this.setTable(table);
	}

	set table(table) {
		this.table = table;
		table.addColumn(this);
	}

	// default input is type="text"
	getForm(instance, options) {
		return jade.renderFile(server.get('views') + '/shared/admin-input.jade', {
			name: this.table.name + '[' + this.name + ']',
			value: instance ? instance[this.name] : '',
			options: this.options
		});
	}
}

class adminTextAreaColumn extends adminTextColumn {
	constructor(table, name, options) {
		super(table, name, options);
	}

	getForm(instance, options) {
		return jade.renderFile(server.get('views') + '/shared/admin-textarea.jade', {
			name: this.table.name + '[' + this.name + ']',
			value: instance ? instance[this.name] : '',
			options: this.options
		});
	}
}

module.exports = {
	mount: mount,
	adminTable: adminTable,
	types: {
		text: adminTextColumn,
		textarea: adminTextAreaColumn
	}
}
