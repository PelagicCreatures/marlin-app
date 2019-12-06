const bcrypt = require('bcryptjs');

module.exports = (usersApp) => {
	function saltAndHash(plaintext) {
		var salt = bcrypt.genSaltSync(usersApp.options.DEFAULT_SALT_ROUNDS);
		return bcrypt.hashSync(plaintext, salt);
	}
	return saltAndHash;
};
