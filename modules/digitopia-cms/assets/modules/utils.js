import * as MDC from './MDC'
import $ from 'jquery'
import Cookies from 'js-cookie'

import {
	bootReagent, Breakpoints
}
	from '../../../reagent'

import {
	digitopiaAnalytics
}
	from './digitopia-analytics.js'

import {
	NewPageHandler
}
	from './new-page-handler.js'

var MDCInstanciateOnce = 0
var flashTimer = null
var snackBar, linearProgress
var linearProgressTimer = null

let loadPage, reloadPage

const boot = () => {
	loadPage = bootReagent({
		breakpoints: {
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
			}]
		},
		hijax: {
			onError: (level, message) => {
				flashAjaxStatus(level, message)
			},
			onLoading: function () {
				progressBar(this.readyState !== 4)
			},
			onExitPage: () => {},
			onEnterPage: () => {
				checkSubscription()
				instantiateMaterialDesignElements($('body'))
			}
		}
	})

	reloadPage = (url) => {
		loadPage(url, true)
	}

	if (publicOptions.USER_BEHAVIOR) {
		const anal = new digitopiaAnalytics(document.body, publicOptions.USER_BEHAVIOR)
	}

	// Things to do when HIJAX loads a new page
	const PageHandler = new NewPageHandler(document.body)

	// hook up material design element controllers
	instantiateMaterialDesignElements($('body'))

	if (Cookies.get('have-account')) {
		$('body').addClass('have-account')
	} else {
		$('body').addClass('dont-have-account')
	}

	// Set initial login state css show/hide behavior
	if (Cookies.get('logged-in')) {
		didLogIn()
	} else {
		didLogOut()
	}

	window.setTimeout(function () {
		$('#splash').fadeOut('fast')
	}, 500)

	$(document).ajaxStart(function () {
		progressBar(true)
	}).ajaxStop(function () {
		progressBar(false)
	})

	$(document).on('click', '.show-notifications-button', (e) => {
		$(e.target).toggleClass('highlight')
		$('#user-alerts').toggleClass('open')
	})
}

// call whenever login occurs
function didLogIn () {
	checkSubscription()
	Cookies.set('have-account', 1, cookieOptions)
	flashAjaxStatus('success', 'Logged in')
	$('body').removeClass('is-logged-out').addClass('is-logged-in').addClass('have-account')
}

// call whenever logout occurs
var didLogOut = () => {
	checkSubscription()
	if (Cookies.get('have-account')) {
		flashAjaxStatus('success', 'Logged out')
	}
	$('body').removeClass('is-logged-in').addClass('is-logged-out')
	Cookies.remove('access_token', cookieOptions)
}

var checkSubscription = () => {
	if (Cookies.get('subscriber')) {
		$('body').removeClass('not-subscriber').addClass('is-subscriber')
	} else {
		$('body').removeClass('is-subscriber').addClass('not-subscriber')
	}

	if (Cookies.get('admin')) {
		$('body').removeClass('not-admin').addClass('is-admin')
	} else {
		$('body').removeClass('is-admin').addClass('not-admin')
	}

	if (Cookies.get('superuser')) {
		$('body').removeClass('not-superuser').addClass('is-superuser')
	} else {
		$('body').removeClass('is-superuser').addClass('not-superuser')
	}
}

// call when you inject content into the DOM programatically
var didInjectContent = (element) => {
	instantiateMaterialDesignElements(element)
}

// This manages material design elements
// called on initial page load, hijax page load events and by didInjectContent.
// some elements like the drawer, snackbar and the navbar only need this once because
// they are defined in the shared html wrapper.
var instantiateMaterialDesignElements = (element) => {
	if (!MDCInstanciateOnce++) {
		const topAppBar = new MDC.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'))

		const nav = new MDC.MDCDrawer(document.querySelector('#nav-drawer'))

		snackBar = new MDC.MDCSnackbar(document.querySelector('.mdc-snackbar'))

		linearProgress = new MDC.MDCLinearProgress(document.querySelector('.mdc-linear-progress'))

		document.querySelector('.mdc-top-app-bar__navigation-icon').addEventListener('click', (e) => {
			e.preventDefault()
			nav.open = !nav.open
		})

		document.querySelector('.mdc-drawer-scrim').addEventListener('click', (e) => {
			e.preventDefault()
			nav.open = !nav.open
		})

		$('body').on('click', '.nav-item', () => {
			nav.open = false
		})
	}

	const inputs = document.querySelectorAll('.mdc-text-field')
	if (inputs && inputs.length) {
		inputs.forEach((element) => {
			MDC.MDCTextField.attachTo(element)
		})
	}

	const selects = document.querySelectorAll('.mdc-select')
	if (selects && selects.length) {
		selects.forEach((element) => {
			MDC.MDCSelect.attachTo(element)
		})
	}

	const switches = document.querySelectorAll('.mdc-switch')
	if (switches && switches.length) {
		switches.forEach((element) => {
			MDC.MDCSwitch.attachTo(element)
		})
	}

	const chips = document.querySelectorAll('.mdc-chip-set')
	if (chips && chips.length) {
		chips.forEach((element) => {
			MDC.MDCChipSet.attachTo(element)
		})
	}

	const wantRipple = document.querySelectorAll('.mdc-fab,.mdc-button,.mdc-icon-button,.mdc-card__primary-action')
	if (wantRipple && wantRipple.length) {
		wantRipple.forEach((element) => {
			MDC.MDCRipple.attachTo(element)
		})
	}
}

// call to show the Material Design "snackbar" for user notifications
var flashAjaxStatus = (level, message) => {
	if (flashTimer) {
		clearTimeout(flashTimer)
	}
	$('.mdc-snackbar').find('.mdc-snackbar__label').html(message)
	snackBar.open()

	flashTimer = setTimeout(function () {
		flashTimer = null
		snackBar.close()
	}, 3000)
}

var progressBar = (show) => {
	if (show) {
		$('body').addClass('wait')
		if (linearProgressTimer) {
			clearTimeout(linearProgressTimer)
			linearProgressTimer = null
		}
		linearProgressTimer = setTimeout(() => {
			linearProgressTimer = null
			linearProgress.open()
		}, 500)
	} else {
		$('body').removeClass('wait')
		if (linearProgressTimer) {
			clearTimeout(linearProgressTimer)
			linearProgressTimer = null
		} else {
			linearProgress.close()
		}
	}
}

/*
 * Viewport - jQuery selectors for finding elements in viewport
 *
 * Copyright (c) 2008-2009 Mika Tuupola
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *  http://www.appelsiini.net/projects/viewport
 *
 */
$.belowthefold = function (element, settings) {
	var fold = $(window).height() + $(window).scrollTop()
	return fold <= $(element).offset().top - settings.threshold
}

$.abovethetop = function (element, settings) {
	var top = $(window).scrollTop()
	return top >= $(element).offset().top + $(element).height() - settings.threshold
}

$.rightofscreen = function (element, settings) {
	var fold = $(window).width() + $(window).scrollLeft()
	return fold <= $(element).offset().left - settings.threshold
}

$.leftofscreen = function (element, settings) {
	var left = $(window).scrollLeft()
	return left >= $(element).offset().left + $(element).width() - settings.threshold
}

$.inviewport = function (element, settings) {
	return !$.rightofscreen(element, settings) && !$.leftofscreen(element, settings) && !$.belowthefold(element, settings) && !$.abovethetop(element, settings)
}

$.extend($.expr[':'], {
	'below-the-fold': function (a, i, m) {
		return $.belowthefold(a, {
			threshold: 0
		})
	},
	'above-the-top': function (a, i, m) {
		return $.abovethetop(a, {
			threshold: 0
		})
	},
	'left-of-screen': function (a, i, m) {
		return $.leftofscreen(a, {
			threshold: 0
		})
	},
	'right-of-screen': function (a, i, m) {
		return $.rightofscreen(a, {
			threshold: 0
		})
	},
	'in-viewport': function (a, i, m) {
		return $.inviewport(a, {
			threshold: 0
		})
	}
})

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
