import * as MDC from './MDC'
import $ from "jquery";
import Cookies from "js-cookie";

var MDCInstanciateOnce = 0;
var flashTimer = null;
var snackBar, linearProgress;
var linearProgressTimer = null;

const boot = () => {
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
		cookieDomain: publicOptions.COOKIE_DOMAIN ? publicOptions.COOKIE_DOMAIN : null
	};

	$('body').digitopiaController(options);

	if (publicOptions.USER_BEHAVIOR) {
		$('body').digitopiaAnalytics(publicOptions.USER_BEHAVIOR);
	}

	// Things to do when HIJAX loads a new page
	$('body').on('DigitopiaDidLoadNewPage', function (e) {
		if (e.target === this) {
			checkSubscription();

			instantiateMaterialDesignElements($('body'));
		}
	});

	// hook up material design element controllers
	instantiateMaterialDesignElements($('body'));

	if (Cookies.get('have-account')) {
		$('body').addClass('have-account');
	}
	else {
		$('body').addClass('dont-have-account');
	}

	// Set initial login state css show/hide behavior
	if (Cookies.get('logged-in')) {
		didLogIn();
	}
	else {
		didLogOut();
	}

	window.setTimeout(function () {
		$('#splash').fadeOut('fast');
	}, 500);

	$(document).ajaxStart(function () {
		progressBar(true);
	}).ajaxStop(function () {
		progressBar(false);
	});

	$(document).on('click', '.show-notifications-button', (e) => {
		$(e.target).toggleClass('highlight');
		$('#user-alerts').toggleClass('open');
	});
}

// call whenever login occurs
function didLogIn() {
	checkSubscription();
	Cookies.set('have-account', 1, cookieOptions)
	flashAjaxStatus('success', 'Logged in');
	$('body').removeClass('is-logged-out').addClass('is-logged-in').addClass('have-account');
	$('.DigitopiaInstance').trigger('DidLogIn');
}

// call whenever logout occurs
var didLogOut = () => {
	checkSubscription()
	flashAjaxStatus('success', 'Logged out');
	$('body').removeClass('is-logged-in').addClass('is-logged-out');
	Cookies.remove('access_token', cookieOptions);
	$('.DigitopiaInstance').trigger('DidLogOut');
}

var checkSubscription = () => {
	if (Cookies.get('subscriber')) {
		$('body').removeClass('not-subscriber').addClass('is-subscriber');
	}
	else {
		$('body').removeClass('is-subscriber').addClass('not-subscriber');
	}

	if (Cookies.get('admin')) {
		$('body').removeClass('not-admin').addClass('is-admin')
	}
	else {
		$('body').removeClass('is-admin').addClass('not-admin')
	}

	if (Cookies.get('superuser')) {
		$('body').removeClass('not-superuser').addClass('is-superuser')
	}
	else {
		$('body').removeClass('is-superuser').addClass('not-superuser')
	}
}

// call when you inject content into the DOM programatically
var didInjectContent = (element) => {
	$('body').trigger('DigitopiaInstantiate');
	$('body').data('digitopiaHijax').hijaxLinks(element);
	instantiateMaterialDesignElements(element);
}

// This manages material design elements
// called on initial page load, hijax page load events and by didInjectContent.
// some elements like the drawer, snackbar and the navbar only need this once because
// they are defined in the shared html wrapper.
var instantiateMaterialDesignElements = (element) => {
	if (!MDCInstanciateOnce++) {
		const topAppBar = new MDC.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'));

		const nav = new MDC.MDCDrawer.attachTo(document.querySelector('#nav-drawer'));

		snackBar = new MDC.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));

		linearProgress = new MDC.MDCLinearProgress.attachTo(document.querySelector('.mdc-linear-progress'));

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
			MDC.MDCTextField.attachTo(element);
		});
	}

	let selects = document.querySelectorAll('.mdc-select');
	if (selects && selects.length) {
		selects.forEach((element) => {
			MDC.MDCSelect.attachTo(element);
		});
	}

	let switches = document.querySelectorAll('.mdc-switch');
	if (switches && switches.length) {
		switches.forEach((element) => {
			MDC.MDCSwitch.attachTo(element);
		});
	}

	let chips = document.querySelectorAll('.mdc-chip-set');
	if (chips && chips.length) {
		chips.forEach((element) => {
			MDC.MDCChipSet.attachTo(element);
		});
	}

	let wantRipple = document.querySelectorAll('.mdc-fab,.mdc-button');
	if (wantRipple && wantRipple.length) {
		wantRipple.forEach((element) => {
			new MDC.MDCRipple(element);
		});
	}
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
		$('body').addClass('wait');
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
		$('body').removeClass('wait');
		if (linearProgressTimer) {
			clearTimeout(linearProgressTimer);
			linearProgressTimer = null;
		}
		else {
			linearProgress.close();
		}
	}
}

// load a page programatically
const loadPage = (href) => {
	$('body').trigger('DigitopiaLoadPage', href);
}

// reload current page programatically
const reloadPage = () => {
	$('body').trigger('DigitopiaReloadPage');
}

export {
	boot,
	didLogIn,
	didLogOut,
	checkSubscription,
	didInjectContent,
	instantiateMaterialDesignElements,
	flashAjaxStatus,
	progressBar,
	loadPage,
	reloadPage
}
