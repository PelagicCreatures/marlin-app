const autoprefixer = require('autoprefixer')
const path = require('path')
const WebpackNotifierPlugin = require('webpack-notifier')

const cssConfig = {
	entry: ['./assets/scss/app.scss'],
	output: {
		path: path.resolve(__dirname, 'working/assets')
	},
	mode: 'development',
	watchOptions: {
		poll: 1000 // Check for changes every second
	},
	plugins: [
		new WebpackNotifierPlugin()
	],
	target: 'web',
	module: {
		rules: [{
			test: /\.scss$/,
			use: [{
				loader: 'file-loader',
				options: {
					name: 'bundle.css'
				}
			}, {
				loader: 'extract-loader'
			}, {
				loader: 'css-loader'
			}, {
				loader: 'postcss-loader',
				options: {
					postcssOptions: {
						plugins: () => [autoprefixer()]
					}
				}
			}, {
				loader: 'sass-loader',
				options: {
					sassOptions: {
						includePaths: ['./node_modules', './node_modules/@pelagiccreatures/tropicbird/node_modules']
					}
				}
			}]
		}, {
			test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
			use: [{
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
					outputPath: 'fonts/',
					publicPath: '/dist/css/fonts/'
				}
			}]
		}]
	}
}

module.exports = [
	cssConfig
]
