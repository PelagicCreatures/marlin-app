var basicAuth = require('basic-auth');

module.exports = function (config) {
	return function basicAuthMiddleware(req, res, next) {
		var user = basicAuth(req);
		if (!user || user.name !== config.USER_NAME || user.pass !== config.PASSWORD) {
			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
			return res.sendStatus(401);
		}
		return next();
	};
};
