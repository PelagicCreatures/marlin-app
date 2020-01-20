import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import json from '@rollup/plugin-json'

export default {
	input: './assets/app.js',
	output: {
		format: 'es',
		file: 'public/dist/js/bundle.es.js'
	},

	plugins: [
		json(),
		nodeResolve({
			preferBuiltins: false
		}),
		commonjs({
			namedExports: {
				// jQuery: ['$', 'jQuery'],
				// async: 'async',
				// Vibrant: 'vibrant'
			}
		})
	]
}
