# Example Boilerplate Node ExpressJS Web Application

This repository is a boilerplate app that includes many common functions of a registered user web app. As web apps are usually javascript intensive we use HIJAX to load pages after the initial load. The HIJAX implementation is transparent to the user and to search engines.

TODO
	* password-change API

### Features
	* ExpressJS framework
	* Material Design Availability
	* Responsive design
	* HIJAXed pages
	* Ajax forms and input validation
	* Packaging automation
	* User API (register, login, logout, email validation, password reset etc)
	* ReCaptcha v3 for registration form
	* css compiles from scss and/or stylus
	* client side javascript supports importing and transpiling EC6 modules using webpack and babel

### Project Directory Structure
	* assets - source for client side js and css
		* js - standard ES5 js modules
		* modules - ES6 modules
		* scss - scss source
		* stylus - stylus source
		app.js - webpack bundle app
	* bin - express server
	* modules - local node modules
		* antisocial-users  - user API
	* public - public files
		* dist - compiled JS and CSS (managed by grunt)
		* images
	* routes - page routes
		* index.js - home page
		* user-pages.js - user reg forms etc.
	* tests - mocha testing suite
	* views - pug templates for pages
		* components - reusable page components
		* users - user pages
		wrapper.pug - html wrapper
	app.js - express app
	gruntfile.js - grunt automation
	webpack.config.js - webpack automation for ES6 and SCSS (material.io etc)

## Development
install mysql and create tables (see below)
`npm install` install packages
`npm run watch &` run webpack in watch mode
`grunt devel &` run grunt in watch mode
`NODE_ENV=localdev DEBUG=antisocial* npm start` start web services

got to http://localhost:3000 in your browser

As you make changes in assets/ css and js grunt and webpach will recompile client side bundles.

### Testing DB - mysql running on localhost

```
CREATE DATABASE testusers;
USE testusers;
CREATE USER 'testuser'@'localhost' IDENTIFIED BY 'testpassword';
GRANT ALL PRIVILEGES ON testusers.* TO 'testuser'@'localhost';

DROP TABLE users;CREATE TABLE `users` (`id` VARCHAR(64) NOT NULL,`name` VARCHAR(128),`username` VARCHAR(128) NOT NULL,`email` VARCHAR(128) NOT NULL,`password` VARCHAR(128) NOT NULL,`validated` CHAR(1),`created` VARCHAR(19),`stripeCustomer` VARCHAR(128),`stripeSubscription` VARCHAR(128),`stripeStatus` VARCHAR(128),`pendingEmail` VARCHAR(128) NOT NULL,PRIMARY KEY (`id`),UNIQUE KEY `username` (`username`),UNIQUE KEY `email` (`email`),UNIQUE KEY `pendingEmail` (`pendingEmail`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE tokens;CREATE TABLE `tokens` (`id` VARCHAR(64) NOT NULL,`userId` VARCHAR(64) NOT NULL,`token` VARCHAR(64) NOT NULL,`ttl` int NOT NULL,`created` VARCHAR(19),`lastaccess` VARCHAR(19),PRIMARY KEY (`id`),UNIQUE KEY `token` (`token`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;

```
