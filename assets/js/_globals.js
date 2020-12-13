// Define globals that need to be visible to all ES5 JS in this directory

window.cookieOptions = {
	path: '/',
	domain: publicOptions.COOKIE_DOMAIN ? publicOptions.COOKIE_DOMAIN : document.location.hostname,
	expires: 365
}

let serviceWorker = null

if ('serviceWorker' in navigator) {
	// if (window.navigator.standalone == true || window.matchMedia('(display-mode: standalone)').matches) {
	window.addEventListener('load', async () => {
		serviceWorker = await navigator.serviceWorker.register('/service-worker.js', {
			scope: '/'
		})
	})
	// }
}
