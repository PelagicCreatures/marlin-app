const debug = require('debug')('antisocial-db');
const VError = require('verror').VError;
const pug = require('pug');
const EventEmitter = require('events');

class adminTable extends EventEmitter {

	constructor(model,options) {
		debug('adminTable create %s',model.name);
		super();
		this.name = model.name;
		this.options = options;
		this.model = model;
		this.columns = [];
		this.build();
	}

	build() {
		console.log("model %j %j",this.model.fieldRawAttributesMap);
		for(let col in this.model.fieldRawAttributesMap) {
			console.log('col: name: %s.%s attributes: %j',this.model.name,col,this.model.tableAttributes[col])

			/*
				_readOnlyAttributes
			*/
		}
		for(let assoc in this.model.associations) {
			console.log('Association: name: %s.%s attributes: %j',this.model.name,assoc,this.model.associations[assoc])
		}
	}

	getColumn(name) {
		for(let i = 0; i < this.columns.length; i++) {
			if (this.columns[i].name == name){
				return this.columns[i];
			}
		}
		return null;
	}

	addColumn(column){
		let isAnAdminColumn = column instanceof adminTableColumn;
		if(!isAnAdminColumn) {
			throw(new VError('adminTable.addColumn %s, column is not an adminTableColumn',this.name));
			return;
		}

		if(getColumn(column.name)) {
			throw(new VError('adminTable.addColumn %s, column %s already defined',this.name,column.name));
			return;
		}

		columns[column.name] = column;
	}
}

class adminTextColumn extends EventEmitter {

	constructor(table,name,options) {
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
	getForm(instance,options) {
		return jade.renderFile(server.get('views') + '/shared/admin-input.jade', {
			name: this.table.name + '['+this.name+']',
			value: instance ? instance[this.name] : '',
			options: this.options
		});
	}
}

class adminTextAreaColumn extends adminTextColumn {
	constructor(table,name,options) {
		super(table,name,options);
	}

	getForm(instance,options) {
		return jade.renderFile(server.get('views') + '/shared/admin-textarea.jade', {
			name: this.table.name + '['+this.name+']',
			value: instance ? instance[this.name]: '',
			options: this.options
		});
	}
}

module.exports = {
	adminTable:adminTable,
	adminTextColumn:adminTextColumn,
	adminTextAreaColumn:adminTextAreaColumn
}
