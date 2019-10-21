const autoprefixer = require('autoprefixer');
const path = require('path');
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
	mode: 'development',
	entry: ['./assets/scss/app.scss', './assets/app.js'],
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'working/assets'),
		library: 'App'
	},
	watchOptions: {
		poll: 1000 // Check for changes every second
	},
	plugins: [
		new WebpackNotifierPlugin(),
	],
	target: 'web',
	module: {
		rules: [{
			test: /\.scss$/,
			use: [{
				loader: 'file-loader',
				options: {
					name: 'bundle.css',
				},
			}, {
				loader: 'extract-loader'
			}, {
				loader: 'css-loader'
			}, {
				loader: 'postcss-loader',
				options: {
					plugins: () => [autoprefixer()]
				}
			}, {
				loader: 'sass-loader',
				options: {
					sassOptions: {
						includePaths: ['./node_modules'],
					}
				},
			}],
		}, {
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /(node_modules|bower_components)/,
			query: {
				presets: ['@babel/preset-env'],
			},
		}, {
			test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
			use: [{
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
					outputPath: 'fonts/'
				}
			}]
		}],
	},
};
