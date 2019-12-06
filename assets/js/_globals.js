// Define globals that need to be visible to all ES5 JS in this directory
var jQuery = App.jQuery;
var $ = App.jQuery;
var async = App.async;

const cookieOptions = {
	path: '/',
	domain: publicOptions.COOKIE_DOMAIN ? publicOptions.COOKIE_DOMAIN : document.location.hostname,
	expires: 365
}

// load a page programatically
const loadPage = (href) => {
	$('body').trigger('DigitopiaLoadPage', href);
}

// reload current page programatically
const reloadPage = () => {
	$('body').trigger('DigitopiaReloadPage');
}
