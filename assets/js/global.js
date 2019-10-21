var MDCInstanciateOnce = 0;
var flashTimer = null;
var snackBar, linearProgress;
var linearProgressTimer = null;

var boot = () => {

	// set up digitopia framework for HIJAX
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

	// Things to do when HIJAX loads a new page
	$('body').on('DigitopiaDidLoadNewPage', function (e) {
		if (e.target === this) {
			checkSubscription();

			instantiateMaterialDesignElements($('body'));
		}
	});

	// hook up material design element controllers
	instantiateMaterialDesignElements($('body'));

	if (App.Cookies.get('have-account')) {
		$('body').addClass('have-account');
	}
	else {
		$('body').addClass('dont-have-account');
	}

	// Set initial login state css show/hide behavior
	if (getAccessToken()) {
		didLogIn();
	}
	else {
		didLogOut();
	}

	window.setTimeout(function () {
		$('#splash').fadeOut('fast');
	}, 1000);

	$(document).ajaxStart(function () {
		progressBar(true);
	}).ajaxStop(function () {
		progressBar(false);
	});
}

const cookieOptions = {
	path: '/',
	domain: document.location.hostname,
	expires: 365
}

// call whenever login occurs
function didLogIn() {
	checkSubscription();
	App.Cookies.set('have-account', 1, cookieOptions)
	flashAjaxStatus('success', 'Logged in');
	$('body').removeClass('is-logged-out').addClass('is-logged-in').addClass('have-account');
	$('.DigitopiaInstance').trigger('DidLogIn');
}

// call whenever logout occurs
var didLogOut = () => {
	checkSubscription()
	flashAjaxStatus('success', 'Logged out');
	$('body').removeClass('is-logged-in').addClass('is-logged-out');
	App.Cookies.remove('access_token', cookieOptions);
	$('.DigitopiaInstance').trigger('DidLogOut');
}

var checkSubscription = () => {
	if (App.Cookies.get('subscriber')) {
		$('body').removeClass('dont-have-subscription').addClass('have-subscription');
	}
	else {
		$('body').removeClass('have-subscription').addClass('dont-have-subscription');
	}
}

var getAccessToken = () => {
	return App.Cookies.get('access-token');
}

// load a page programatically
var loadPage = (href) => {
	$('body').trigger('DigitopiaLoadPage', href);
}

// reload current page programatically
var reloadPage = () => {
	$('body').trigger('DigitopiaReloadPage');
}

// call to show the Material Design "snackbar" for user notifications
var flashAjaxStatus = (level, message) => {
	if (flashTimer) {
		clearTimeout(flashTimer);
	}
	$('.mdc-snackbar').find('.mdc-snackbar__label').html(message);
	snackBar.open();

	flashTimer = setTimeout(function () {
		flashTimer = null;
		snackBar.close();
	}, 3000);
}

var progressBar = (show) => {
	if (show) {
		if (linearProgressTimer) {
			clearTimeout(linearProgressTimer);
			linearProgressTimer = null;
		}
		linearProgressTimer = setTimeout(() => {
			linearProgressTimer = null;
			linearProgress.open();
		}, 500);
	}
	else {
		if (linearProgressTimer) {
			clearTimeout(linearProgressTimer);
			linearProgressTimer = null;
		}
		else {
			linearProgress.close();
		}
	}
}

// call when you inject content into the DOM programatically
var didInjectContent = (element) => {
	$('#document-body').trigger('DigitopiaInstantiate');
	$('#document-body').data('digitopiaHijax').hijaxLinks(element);
	instantiateMaterialDesignElements(element);
}

// This manages material design elements
// called on initial page load, hijax page load events and by didInjectContent.
// some elements like the drawer, snackbar and the navbar only need this once because
// they are defined in the shared html wrapper.
var instantiateMaterialDesignElements = (element) => {
	if (!MDCInstanciateOnce++) {
		const topAppBar = new App.MDC.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'));

		const nav = new App.MDC.MDCDrawer.attachTo(document.querySelector('#nav-drawer'));

		snackBar = new App.MDC.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));

		linearProgress = new App.MDC.MDCLinearProgress.attachTo(document.querySelector('.mdc-linear-progress'));

		document.querySelector('.mdc-top-app-bar__navigation-icon').addEventListener('click', (e) => {
			e.preventDefault();
			nav.open = !nav.open;
		});

		document.querySelector('.mdc-drawer-scrim').addEventListener('click', (e) => {
			e.preventDefault();
			nav.open = !nav.open;
		});

		$('body').on('click', '.nav-item', () => {
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
