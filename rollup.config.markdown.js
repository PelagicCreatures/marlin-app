import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'

import {
	terser
}
	from 'rollup-plugin-terser'

export default {
	input: '@pelagiccreatures/marlin/assets/markdown.js',
	output: {
		format: 'iife',
		file: 'public/dist/js/markdown.iife.js',
		sourcemap: true
	},
	plugins: [
		json(),
		nodeResolve({
			preferBuiltins: false
		}),
		commonjs({}),
		terser({
			output: {
				comments: false
			}
		})
	]
}
