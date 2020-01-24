import $ from 'jquery'
import Cookies from 'js-cookie'

import {
	bootSargasso
}
	from '@pelagiccreatures/sargasso'

import {
	TropicBird
}
	from '@pelagiccreatures/tropicbird'

import {
	FlyingFish
}
	from '@pelagiccreatures/flyingfish'

var linearProgress
var linearProgressTimer = null

let loadPage, reloadPage, tropicBird

const boot = () => {
	loadPage = bootSargasso({
		scrollElement: document.getElementById('overscroll-wrapper') || window,
		breakpoints: {},
		hijax: {
			onError: (level, message) => {
				flashAjaxStatus(level, message)
			},
			onLoading: function () {
				tropicBird.progressBar(this.readyState !== 4)
			},
			onExitPage: () => {},
			onEnterPage: () => {
				checkSubscription()
			}
		}
	})

	tropicBird = new TropicBird(document.body, {})
	tropicBird.start()

	reloadPage = (url) => {
		loadPage(url, true)
	}

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
var didInjectContent = (element) => {}

// call to show the Material Design "snackbar" for user notifications
var flashAjaxStatus = (level, message) => {
	tropicBird.pushSnackBar(level, message)
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
	flashAjaxStatus,
	progressBar,
	loadPage,
	reloadPage,
	tropicBird
}
