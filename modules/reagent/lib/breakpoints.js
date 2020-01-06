/**
	Breakpoints

	Reagent class that maintains css classes on the document body
	to be used in css rules for implementing visibility and
	responsive behavior
**/
import $ from 'jquery'

import {
	Reagent, registerReagentClass
}
	from './Reagent'

import Cookies from 'js-cookie'

class Breakpoints extends Reagent {
	constructor (element, options = {}) {
		options.watchResize = true
		super(element, options)

		this.jqElement = $(element)

		this.scale = undefined
		this.disabled = false
		this.forceScale = undefined

		this.config = $.extend({
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
		}, options || {})

		this.widths = []
		this.classes = []
	}

	start () {
		super.start()
		let css = '.show-hide{display:none;}\n'
		this.widths.push(0)
		for (let i = 0; i < this.config.breakpoints.length; i++) {
			if (this.config.breakpoints[i].maxWidth) {
				this.widths.push(this.config.breakpoints[i].maxWidth)
			}
			this.classes.push(this.config.breakpoints[i].className)

			css += '.' + this.config.breakpoints[i].className + ' .hidden-' + this.config.breakpoints[i].className + '{display:none;}\n'
			css += '.not-' + this.config.breakpoints[i].className + ' .hidden-not-' + this.config.breakpoints[i].className + '{display:none;}\n'
			css += '.' + this.config.breakpoints[i].className + ' .shown-' + this.config.breakpoints[i].className + '{display:block;}\n'
			css += '.not-' + this.config.breakpoints[i].className + ' .shown-not-' + this.config.breakpoints[i].className + '{display:block;}\n'
		}

		const style = document.createElement('style')
		style.type = 'text/css'
		style.innerHTML = css
		document.getElementsByTagName('head')[0].appendChild(style)
		this.detectGeometry()
	};

	didResize () {
		super.didResize()
		this.detectGeometry()
	}

	disableResponsive (scale) {
		$('body').addClass('disable-responsive')
		this.disabled = true
		this.forceScale = scale
		this.detectGeometry()
	}

	enableResponsive () {
		$('body').removeClass('disable-responsive')
		this.disabled = false
		this.forceScale = ''
		this.detectGeometry()
	}

	detectGeometry () {
		let newScale = this.classes[this.widths.length - 1]

		if (this.disabled) {
			newScale = this.forceScale
		} else {
			const ww = $(window).width()
			for (let i = 0; i < this.widths.length - 1; i++) {
				if (ww >= this.widths[i] && ww < this.widths[i + 1]) {
					newScale = this.classes[i]
					break
				}
			}
		}

		let changed = 0

		if (newScale !== this.scale) {
			++changed
			for (let i = 0; i < this.classes.length; i++) {
				if (this.classes[i] !== newScale) {
					$('body').addClass('not-' + this.classes[i])
					$('body').removeClass(this.classes[i])
					$('body').removeClass('shown-' + this.classes[i])
					$('body').removeClass('hidden-' + this.classes[i])
				} else {
					$('body').removeClass('not-' + this.classes[i])
				}
			}
			$('body').addClass(newScale)
			$('body').addClass('shown-' + newScale)
			$('body').addClass('hidden-' + newScale)

			this.notifyAll('didBreakpoint', [newScale])
		}

		this.scale = newScale

		if (changed) {
			this.setHints()
		}
	}

	setHints () {
		let classes = ''

		if (this.scale) {
			if (classes) {
				classes += ' '
			}
			classes += this.scale
		}

		if (classes !== this.getCookie('responsive')) {
			this.setCookie('responsive', classes)
		}
	};

	getCookie (key) {
		return Cookies.get(key)
	};

	setCookie (key, value, expires) {
		const options = {
			path: '/',
			domain: publicOptions.COOKIE_DOMAIN,
			expires: expires
		}
		Cookies.set(key, value, options)
	};

	deleteCookie (key) {
		this.setCookie(key, null)
	};
};

registerReagentClass('Breakpoints', Breakpoints)

export {
	Breakpoints
}
