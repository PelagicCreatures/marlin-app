Building modern websites is not as easy as you might think. Many complex standards and protocols come into play on even the simplest web service. We've always taken the approach of working from an idealized boilerplate project framework as our starting point for client work and we have earned a reputation for leveraging up very large projects in a very short development window using this approach. Over the last few months I have been working on building a new version of our boilerplate project for containerized services.

I am using this blog to formalized and prove the implementation of various subsystems. It has all the modern capabilities of a database/content driven site.

* Node.js - ES6 framework for serving HTTP.
* Express.js - a framework for web services.
* Sequelize - ORDBM with several backends.

I have built several generalized CMS oriented tools that run on top of this framework
* /admin - A suite of editing tools that generate a customized site data administration and content management.
* /users - An API for managing reg/login, user roles and access permission for site administrators and visitors.
* Hardened API endpoints with comprehensive authentication and input validation.

UI frameworks
* HIJAX with deep linking.
* JS Controllers that are automatically instantiated on HTML elements to handle user interaction
* Database schema driven forms for collecting and storing data with user permissions and data validation
* Material.io - Material design is a general style guide for web sites that works from small devices to big screens.
* Content Security Protocol, CSRF, ReCaptcha3
* Unified Ajax form validation, submission and progress status notification.

Automation of testing, packaging, deployment using webpack, grunt, mocha and other tools
* CSS, SCSS, Stylus bundles
* JS (ES5 and ES6) bundles
* Docker Containerization
* Certbot HTTPS certificate management
