module.exports = (app) => {
	if (app.config.analyticsOptions) {
		const analyics = require('../lib/analytics')
		analyics.mount(app, app.config.analyticsOptions)
	}
}
