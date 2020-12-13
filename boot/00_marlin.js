// set up and mount the user API and admin
module.exports = (app) => {
	require('@pelagiccreatures/marlin')(app, app.config)
}
