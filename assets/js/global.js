var MDCInstanciateOnce = 0;
var flashTimer = null;

function boot() {
	var options = {
		'coverResize': false,
		'geometry': {
			'enabled': true,
			breakpoints: [{
				className: 'screen-xsmall',
				maxWidth: 600
			}, {
				className: 'screen-small',
				maxWidth: 960
			}, {
				className: 'screen-medium',
				maxWidth: 1280
			}, {
				className: 'screen-large',
				maxWidth: undefined
			}, ],
		},
		'hijax': {
			'enabled': true,
			'disableScrollAnimation': true
		},
	};

	$('body').digitopiaController(options);

	instantiateMaterialDesignElements();

	if (getAccessToken()) {
		didLogIn();
	}
	else {
		didLogOut();
	}
}

const cookieOptions = {
	path: '/',
	domain: document.location.hostname
}

function didLogIn() {
	flashAjaxStatus('success', 'Logged in');
	$('body').removeClass('is-logged-out').addClass('is-logged-in');
	$('.DigitopiaInstance').trigger('DidLogIn');
}

function didLogOut() {
	flashAjaxStatus('success', 'Logged out');
	$('body').removeClass('is-logged-in').addClass('is-logged-out');
	App.Cookies.remove('access_token', cookieOptions);
	$('.DigitopiaInstance').trigger('DidLogOut');
}

function getAccessToken() {
	return App.Cookies.get('access-token');
}

function loadPage(href) {
	$('body').trigger('DigitopiaLoadPage', href);
}

function flashAjaxStatus(level, message) {
	if (flashTimer) {
		clearTimeout(flashTimer);
	}
	$('#ajax-status').find('.mdc-snackbar__text').html(message);
	$('#ajax-status').addClass('mdc-snackbar--active');

	flashTimer = setTimeout(function () {
		flashTimer = null;
		$('#ajax-status').removeClass('mdc-snackbar--active');
	}, 1500);
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

	let inputs = document.querySelectorAll('.mdc-text-field');
	if (inputs && inputs.length) {
		inputs.forEach((element) => {
			App.MDC.MDCTextField.attachTo(element);
		});
	}

	let wantRipple = document.querySelectorAll('.mdc-fab,.mdc-button');
	if (wantRipple && wantRipple.length) {
		wantRipple.forEach((element) => {
			new App.MDC.MDCRipple(element);
		});
	}
}
