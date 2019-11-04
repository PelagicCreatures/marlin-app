const debug = require('debug')('antisocial-admin');
const VError = require('verror').VError;
const pug = require('pug');
const EventEmitter = require('events');
const express = require('express');

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
		this.build();
	}

	build() {
		console.log("model %j %j", this.model.fieldRawAttributesMap);
		for (let col in this.model.fieldRawAttributesMap) {
			console.log('col: name: %s.%s attributes: %j', this.model.name, col, this.model.tableAttributes[col])

			/*
				_readOnlyAttributes
			*/
		}
		for (let assoc in this.model.associations) {
			console.log('Association: name: %s.%s attributes: %j', this.model.name, assoc, this.model.associations[assoc])
		}
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
	adminTextColumn: adminTextColumn,
	adminTextAreaColumn: adminTextAreaColumn
}
