module.exports = function (grunt) {
	const cssFiles = [
		'working/assets/*.css',
		'assets/css/*.css',
		'node_modules/animate.css/animate.css'
	]

	const stylusFiles = [
		'assets/stylus/*.styl'
	]

	const watchfiles = ['@pelagiccreatures/marlin/views/shared/*.pug', 'assets/workers/*.js']

	let allFiles = []
	allFiles = allFiles.concat(watchfiles, cssFiles, stylusFiles)

	const copyCommand = [{
		expand: true,
		cwd: 'node_modules/workbox-sw/build/',
		src: ['workbox-sw.js', 'workbox-sw.js.map'],
		dest: 'public/dist/js/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'node_modules/workbox-strategies/build/',
		src: ['workbox-strategies.prod.js', 'workbox-strategies.prod.js.map'],
		dest: 'public/dist/js/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'node_modules/workbox-cacheable-response/build/',
		src: ['workbox-cacheable-response.prod.js', 'workbox-cacheable-response.prod.js.map'],
		dest: 'public/dist/js/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'node_modules/workbox-routing/build/',
		src: ['workbox-routing.prod.js', 'workbox-routing.prod.js.map'],
		dest: 'public/dist/js/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'node_modules/workbox-core/build/',
		src: ['workbox-core.prod.js', 'workbox-core.prod.js.map'],
		dest: 'public/dist/js/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'node_modules/workbox-expiration/build/',
		src: ['workbox-expiration.prod.js', 'workbox-expiration.prod.js.map'],
		dest: 'public/dist/js/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'assets/workers/',
		src: ['service-worker.js', 'service-worker.js'],
		dest: 'public/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'working/assets/fonts/',
		src: ['*.*'],
		dest: 'public/dist/css/fonts',
		filter: 'isFile'
	}]

	grunt.initConfig({
		jsDistDir: 'public/dist/js/',
		cssDistDir: 'public/dist/css/',
		pkg: grunt.file.readJSON('package.json'),
		exec: {
			confirmDialogTemplate: 'npx pug --client --no-debug --pretty --out working/templates --name confirmDialogTemplate  node_modules/@pelagiccreatures/marlin/views/shared/confirm-dialog.pug'
		},
		copy: {
			main: {
				files: copyCommand
			}
		},
		stylus: {
			options: {
				compress: false
			},
			compile: {
				files: {
					'working/assets/<%= pkg.name %>-stylus.css': stylusFiles
				}
			}
		},
		concat: {
			css: {
				src: cssFiles,
				dest: '<%=cssDistDir%><%= pkg.name %>.css',
				nonull: true
			}
		},
		cssmin: {
			dist: {
				options: {
					rebase: false
				},
				files: {
					'<%=cssDistDir%><%= pkg.name %>.min.css': ['<%=cssDistDir%><%= pkg.name %>.css']
				}
			}
		},
		watch: {
			files: allFiles,
			tasks: ['exec', 'copy', 'stylus', 'concat']
		}
	})

	grunt.loadNpmTasks('grunt-contrib-copy')
	grunt.loadNpmTasks('grunt-contrib-stylus')
	grunt.loadNpmTasks('grunt-contrib-concat')
	grunt.loadNpmTasks('grunt-contrib-cssmin')
	grunt.loadNpmTasks('grunt-contrib-watch')
	grunt.loadNpmTasks('grunt-exec')

	grunt.registerTask('default', [
		'exec',
		'copy',
		'stylus',
		'concat',
		'cssmin'
	])

	grunt.registerTask('devel', [
		'exec',
		'copy',
		'stylus',
		'concat',
		'watch'
	])
}
