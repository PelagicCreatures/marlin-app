const bcrypt = require('bcryptjs');

module.exports = function passwordMatch(plaintext, user, done) {
	bcrypt.compare(plaintext, user.password, function (err, isMatch) {
		if (err) return done(err);
		done(null, isMatch);
	});
};
