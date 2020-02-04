import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import json from '@rollup/plugin-json'

export default {
	input: './assets/app.js',
	external: [
		// '@pelagiccreatures/sargasso',
		// '@pelagiccreatures/tropicBird',
		// '@pelagiccreatures/flyingFish',
		// '@pelagiccreatures/molamola'
	],

	output: {
		format: 'iife',
		file: 'public/dist/js/userapp.iife.js',
		sourcemap: true,
		name: 'App',
		globals: {
			// '@pelagiccreatures/sargasso': 'PelagicCreatures.Sargasso',
			// '@pelagiccreatures/tropicBird': 'PelagicCreatures.TropicBird',
			// '@pelagiccreatures/flyingFish': 'PelagicCreatures.FlyingFish',
			// '@pelagiccreatures/molamola': 'PelagicCreatures.MolaMola'
		}
	},

	plugins: [
		json(),
		nodeResolve({
			preferBuiltins: false
		}),
		commonjs({
			namedExports: {}
		})
	]
}
