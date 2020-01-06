/**
	Reagent

	Base class for responsive Reagent element controllers. Subclass this to
	define specific behavior. If you mutate the DOM in your code you
	should use frames for best results. EG. LazyBackground
**/

import {
	elementTools
}
	from './utils'

import {
	theDOMWatcher, theScrollWatcher, theResizeWatcher, theOrientationWatcher
}
	from './services'

let unique = 0
const liveElements = []

/*
	All subclasses of Reagent must register the class so that
	the ReagentSupervisor can instantiate them when they appear in the
	DOM
*/
const registeredClasses = {}
const registerReagentClass = (className, object) => {
	registeredClasses[className] = object
}

const tracing = true
const trace = (obj, message) => {
	console.log(obj.constructor.name, obj.uid, message)
}

class Reagent {
	constructor (element, options = {}) {
		this.uid = ++unique
		this.element = element
		this.options = options
		this.pendingAnimationFrame = undefined
		this.frameQueue = []
		this.mortal = true
		this.isInViewport = false

		if (!this.element.registeredResponsiveControllers) {
			this.element.registeredResponsiveControllers = []
		}
		this.element.registeredResponsiveControllers.push(this)

		liveElements.push(this)
	}

	start () {
		if (tracing) trace(this, 'start')

		if (this.options.watchDOM) {
			theDOMWatcher.subscribe(this)
		}

		if (this.options.watchScroll || this.options.watchViewport) {
			theScrollWatcher.subscribe(this)
		}

		if (this.options.watchResize || this.options.watchViewport) {
			theResizeWatcher.subscribe(this)
		}

		if (this.options.watchOrientation || this.options.watchViewport) {
			theOrientationWatcher.subscribe(this)
		}
	}

	notifyAll (event, params) {
		for (let i = 0; i < liveElements.length; i++) {
			const peer = liveElements[i]
			if (peer !== this && peer[event]) {
				peer[event].apply(peer, params)
			}
		}
	}

	notifyElement (element, event, params) {
		for (let i = 0; i < this.element.registeredResponsiveControllers.length; i++) {
			const peer = this.element.registeredResponsiveControllers[i]
			if (peer !== this && peer[event]) {
				peer[event].apply(peer, params)
			}
		}
	}

	flushQueue () {
		if (this.pendingAnimationFrame) {
			cancelAnimationFrame(this.pendingAnimationFrame)
			this.pendingAnimationFrame = undefined
		}
		this.frameQueue = []
	}

	queueFrame (frame) {
		this.frameQueue.push(frame.bind(this))
		if (!this.pendingAnimationFrame) {
			this.pendingAnimationFrame = requestAnimationFrame(() => {
				this.processQueue()
			})
		}
	}

	processQueue () {
		this.pendingAnimationFrame = undefined
		var toProcess = this.frameQueue
		this.frameQueue = []
		for (var i = 0; i < toProcess.length; i++) {
			toProcess[i]()
		}
	}

	sleep () {
		if (this.options.watchDOM) {
			theDOMWatcher.unSubscribe(this)
		}

		if (this.options.watchScroll || this.options.watchViewport) {
			theScrollWatcher.unSubscribe(this)
		}

		if (this.options.watchResize || this.options.watchViewport) {
			theResizeWatcher.unSubscribe(this)
		}

		if (this.options.watchOrientation || this.options.watchViewport) {
			theOrientationWatcher.unSubscribe(this)
		}
	}

	destroy () {
		if (tracing) trace(this, 'destroy')

		this.flushQueue()

		this.sleep()

		if (this.element.registeredResponsiveControllers) {
			if (this.element.registeredResponsiveControllers.indexOf(this) !== -1) {
				this.element.registeredResponsiveControllers.splice(this.element.registeredResponsiveControllers.indexOf(this), 1)
			}
		}

		this.element = null

		if (liveElements.indexOf(this) !== -1) {
			liveElements.splice(liveElements.indexOf(this), 1)
		}
	}

	// these handlers are called by the watchers - prolly should leave these alone

	watchDOM () {
		this.DOMChanged()
	}

	watchScroll () {
		if (this.options.watchViewport) {
			this.inViewport()
		}

		this.didScroll()
	}

	watchResize () {
		if (this.options.watchViewport) {
			this.inViewport()
		}

		this.didResize()
	}

	watchOrientation () {
		if (window.orientation && (window.orientation === 90 || window.orientation === 270)) {
			this.wantFullscreen(true)
		} else {
			this.wantFullscreen(false)
		}
	}

	// you can call these from a subclass such as an 'enlarge to full screen' button
	// otherwise if watchOrientation is set it will do this when phone is in lanscape
	// it would be nice to acually use the experimental requestFullScreen thing but
	// you can't do that on rotate at the moment, only on click.

	wantFullscreen (want) {
		if (want) {
			this.enterFullscreen()
		} else {
			this.exitFullscreen()
		}
	}

	// Override these methods in your subclass to take action on these events

	// something changed on the page
	DOMChanged () {}

	// scroll occured
	didScroll () {}

	// resize occured
	didResize () {}

	// new breakpoint
	didBreakpoint () {}

	// element entered the viewport
	enterViewport () {}

	// element exited the viewport
	exitViewport () {}

	// element entered fullscreen
	enterFullscreen () {}

	// element exited fullscreen
	exitFullscreen () {}

	// page changed
	newPage (oldPath, newPath) {}

	// utilities

	hasClass (cssClass) {
		return elementTools.hasClass(this.element, cssClass)
	}

	addClass (cssClass) {
		elementTools.addClass(this.element, cssClass)
	}

	removeClass (cssClass) {
		elementTools.removeClass(this.element, cssClass)
	}

	isVisible () {
		return elementTools.isVisible(this.element)
	}

	inViewport () {
		if (elementTools.inViewPort(this.element)) {
			if (!this.isInViewport) {
				this.enterViewport()
				this.isInViewport = true
			}
		} else {
			if (this.isInViewport) {
				this.exitViewport()
				this.isInViewport = false
			}
		}
	};

	// experimental

	nativeRequestFullScreen () {
		if (document.fullscreenElement) {
			if (document.fullscreenElement === this.element) {
				return
			}
			document.exitFullscreen()
		}

		this.element.requestFullscreen()
	}

	nativeExitFullScreen () {
		if (document.fullscreenElement && document.fullscreenElement === this.element) {
			document.exitFullscreen()
		}
	}
}

// shims for borked browsers
// =========================

/**
 * Element.requestFullScreen() polyfill
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!Element.prototype.requestFullscreen) {
	Element.prototype.requestFullscreen = Element.prototype.mozRequestFullscreen || Element.prototype.webkitRequestFullscreen || Element.prototype.msRequestFullscreen
}

/**
 * document.fullscreenElement polyfill
 * Adapted from https://shaka-player-demo.appspot.com/docs/api/lib_polyfill_fullscreen.js.html
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!document.fullscreenElement) {
	Object.defineProperty(document, 'fullscreenElement', {
		get: function () {
			return document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement
		}
	})

	Object.defineProperty(document, 'fullscreenEnabled', {
		get: function () {
			return document.mozFullScreenEnabled || document.msFullscreenEnabled || document.webkitFullscreenEnabled
		}
	})
}

export {
	Reagent, registerReagentClass, liveElements, registeredClasses
}
