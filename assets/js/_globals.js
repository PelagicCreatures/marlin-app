// Define globals that need to be visible to all ES5 JS in this directory

window.cookieOptions = {
	path: '/',
	domain: publicOptions.COOKIE_DOMAIN ? publicOptions.COOKIE_DOMAIN : document.location.hostname,
	expires: 365
}
