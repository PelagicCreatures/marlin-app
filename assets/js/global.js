var MDCInstanciateOnce = 0;

const $ = App.jQuery;

const cookieOptions = {
	path: '/',
	domain: document.location.hostname
}

function didLogIn() {
	var current = getAccessToken();
	$('body').removeClass('is-logged-out').addClass('is-logged-in');
	$('.DigitopiaInstance').trigger('DidLogIn');
}

function didLogOut() {
	$('body').removeClass('is-logged-in').addClass('is-logged-out');
	App.Cookies.remove('access_token', cookieOptions);
	$('.DigitopiaInstance').trigger('DidLogOut');
}

function getAccessToken() {
	return App.Cookies.get('access_token');
}

if (getAccessToken()) {
	didLogIn();
}
else {
	didLogOut();
}

function instantiateMaterialDesignElements(element) {
	if (!MDCInstanciateOnce++) {
		const topAppBar = new App.MDC.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'));

		const nav = new App.MDC.MDCDrawer.attachTo(document.querySelector('#nav-drawer'));

		document.querySelector('.mdc-top-app-bar__navigation-icon').addEventListener('click', (e) => {
			e.preventDefault();
			nav.open = !nav.open;
		});

		document.querySelector('.mdc-drawer-scrim').addEventListener('click', (e) => {
			e.preventDefault();
			nav.open = !nav.open;
		});

		$('body').on('click', '.nav-item', function () {
			nav.open = false;
		});
	}

	let wantRipple = document.querySelectorAll('.mdc-fab,.mdc-button');
	if (wantRipple && wantRipple.length) {
		wantRipple.forEach((element) => {
			new App.MDC.MDCRipple(element);
		});
	}
}

instantiateMaterialDesignElements();
