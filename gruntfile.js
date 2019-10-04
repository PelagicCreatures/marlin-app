module.exports = function (grunt) {

	var jsFiles = ['working/assets/*.js', 'assets/js/*.js'];
	var cssFiles = ['working/assets/*.css', 'assets/css/*.css'];
	var stylusFiles = [
		'assets/stylus/*.styl'
	];
	var allFiles = [];
	allFiles = allFiles.concat(jsFiles, cssFiles, stylusFiles);

	grunt.initConfig({
		jsDistDir: 'public/dist/js/',
		cssDistDir: 'public/dist/css/',
		pkg: grunt.file.readJSON('package.json'),
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
			tasks: ['concat']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-terser');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', [
		'stylus',
		'concat',
		'cssmin',
		'terser'
	]);

	grunt.registerTask('devel', [
		'stylus',
		'concat',
		'watch'
	]);
}
