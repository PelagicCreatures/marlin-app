// Define globals that need to be visible to all ES5 JS in this directory

window.cookieOptions = {
	path: '/',
	domain: publicOptions.COOKIE_DOMAIN ? publicOptions.COOKIE_DOMAIN : document.location.hostname,
	expires: 365
}

window.serviceWorkerRegistration = null

if (publicOptions.SERVICE_WORKER && 'serviceWorker' in navigator) {
	window.addEventListener('load', async () => {
		const options = {
			scope: '/'
		}
		navigator.serviceWorker.register(publicOptions.SERVICE_WORKER, options).then(function (reg) {
			window.serviceWorkerRegistration = reg
		})
	})
}
