# Boilerplate Node ExpressJS Web Application

This repository is a boilerplate app that includes many common functions of a web site/app featuring registered users. As web apps are usually javascript intensive we use HIJAX to load pages after the initial load. This HIJAX implementation is transparent to the user and to search engines. This can be used as a starting point for many types of web projects.

### Features
	* ExpressJS framework w/Pug templates
	* Material Design Availability
	* Responsive design
	* HIJAXed pages
	* Data model driven database (sequelize)
	* Complete User API (register, login, logout, email validation, password reset etc)
	* Admin data editing UI suite automatically built from data model.
	* ACL access control on tables by user role (superuser, admin, etc.)
	* Ajax forms and unified input validation
	* Stripe for subscription plans
	* Packaging automation for client distribution using webpack (sass, ES6) and grunt
	* ReCaptcha v3 support for registration
	* CSS compiles from SCSS and/or stylus
	* CSRF protection support
	* Content Security Protocol support

### Project Directory Structure
	* assets/ - source for client side js and css
		* js/ - standard ES5 js modules
		* modules/ - ES6 modules
		* scss/ - scss source
		* stylus/ - stylus source
		* app.js - webpack bundle
	* bin/ - express server listener
	* config/
	* lib/
	* migrations/
	* models/
	* modules/ - local node modules
		* antisocial-users/  - user API
		* digitopia/ - client side controllers
	* public/ - public files
		* dist/ - compiled JS and CSS (managed by grunt)
		* images/
	* routes/ - page routes
		* index.js - home page
		* user-pages.js - user reg forms etc.
	* seeders/
	* tests/ - mocha testing suite
	* views/ - pug templates for pages
		* admin/ - site admin UI
		* components/ - reusable page components
		* shared/ - client/server shared templates
		* users/ - user pages
		* wrapper.pug - html wrapper
	* app.js - express app
	* gruntfile.js - grunt automation
	* webpack.config.js - webpack automation for ES6 and SCSS (material.io etc)

## using this project as a template
git remote add template https://github.com/antiSocialNet/user-boilerplate.git
git fetch --all
git merge template/master
git merge template/master --allow-unrelated-histories

Any changes to files in this project can then be merged into your project
