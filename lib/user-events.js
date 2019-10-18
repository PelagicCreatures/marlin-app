module.exports = (userAPI) => {
	userAPI.on('didRegister', (user, post, cb) => {
		console.log('didRegister event user: %j', user);
		cb();
	})

	userAPI.on('sendEmailConfirmation', function (user, token) {
		console.log('sendEmailConfirmation event user: %j token: %j', user, token);
	});

	userAPI.on('sendPasswordReset', function (user, token) {
		console.log('sendPasswordReset user: %j token: %j', user, token);
	});
}
