const path = require('path')

module.exports = {
	mode: 'development',
	entry: './assets/app.js',
	target: 'web',
	devtool: 'source-map',
	output: {
		path: path.resolve(__dirname, 'public'),
		filename: './dist/js/userapp-es.js',
		library: 'App'
	}
}
