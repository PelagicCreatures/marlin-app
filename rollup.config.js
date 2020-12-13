import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'

import {
	terser
}
	from 'rollup-plugin-terser'

export default {
	input: './assets/app.js',

	output: {
		format: 'iife',
		file: 'public/dist/js/marlinapp.iife.js',
		sourcemap: true,
		name: 'App',
		compact: true
	},

	plugins: [
		json(),
		commonjs({}),
		nodeResolve({
			preferBuiltins: false,
			dedupe: (dep) => {
				return dep.match(/^(@pelagiccreatures|lodash|js-cookie)/)
			}
		}),
		terser({
			output: {
				comments: false
			}
		})
	]
}
