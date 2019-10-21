module.exports = function (grunt) {

	var jsFiles = [
		'working/assets/*.js',
		'assets/js/*.js',
		//'modules/digitopia/dist/js/digitopia.js',
	];

	var cssFiles = [
		'modules/digitopia/dist/css/digitopia.css',
		'working/assets/*.css',
		'assets/css/*.css'
	];

	var stylusFiles = [
		'assets/stylus/*.styl'
	];

	var allFiles = [];
	allFiles = allFiles.concat(jsFiles, cssFiles, stylusFiles);

	var copyCommand = [{
		expand: true,
		cwd: 'node_modules/jquery/dist/',
		src: ['jquery.js', 'jquery.min.js'],
		dest: 'public/dist/js/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'modules/digitopia/',
		src: ['images/*'],
		dest: 'public/digitopia/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'working/assets/',
		src: ['*.map'],
		dest: 'public/dist/js/',
		filter: 'isFile'
	}, {
		expand: true,
		cwd: 'working/assets/fonts/',
		src: ['*.*'],
		dest: 'public/dist/css/fonts',
		filter: 'isFile'
	}];

	grunt.initConfig({
		jsDistDir: 'public/dist/js/',
		cssDistDir: 'public/dist/css/',
		pkg: grunt.file.readJSON('package.json'),
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
			js: {
				options: {
					separator: grunt.util.linefeed + ';' + grunt.util.linefeed
				},
				src: jsFiles,
				dest: '<%=jsDistDir%><%= pkg.name %>.js',
				nonull: true

			},
			css: {
				src: cssFiles,
				dest: '<%=cssDistDir%><%= pkg.name %>.css',
				nonull: true
			}
		},
		terser: {
			dist: {
				options: {},
				files: {
					'<%=jsDistDir%><%= pkg.name %>.min.js': '<%=jsDistDir%><%= pkg.name %>.js',
				}
			},
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
			tasks: ['copy', 'stylus', 'concat']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-terser');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', [
		'copy',
		'stylus',
		'concat',
		'cssmin',
		'terser'
	]);

	grunt.registerTask('devel', [
		'copy',
		'stylus',
		'concat',
		'watch'
	]);
}
