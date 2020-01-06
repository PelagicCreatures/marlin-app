/*
	Shared event observers used by Reagent classes.

	When these observers have subscribers they watch for events
	and notify the subscriber's specific event handler
	method when they occur.

	Subscribers to these services must imlement handler methods
	EG. watchDOM, watchScroll, watchResize, watchOrientation
*/

import {
	elementTools
}
	from './utils'

const debounce = require('lodash/debounce')

class ObserverSubscriptionManager {
	constructor () {
		this.observers = []
	}

	subscribe (observer) {
		if (!this.observers.length) {
			this.wakeup()
		}
		this.observers.push(observer)
	}

	unSubscribe (observer) {
		this.observers.splice(this.observers.indexOf(observer), 1)
		if (!this.observers.length) {
			this.sleep()
		}
	}

	sleep () {}

	wakeup () {}

	notifyObservers (event) {
		for (let i = 0; i < this.observers.length; i++) {
			if (this.observers[i][event]) {
				this.observers[i][event]()
			}
		}
	}
}

class DOMWatcher extends ObserverSubscriptionManager {
	constructor () {
		super()

		// debounce - just need to know if a change occured, not every change
		this.mutationHandler = debounce((mutations, observer) => {
			this.observeDOM(mutations, observer)
		}, 250, {
			maxWait: 500
		})

		this.mutationObserver = new MutationObserver(this.mutationHandler, false)
	}

	subscribe (observer) {
		super.subscribe(observer)
		observer.watchDOM()
	}

	wakeup () {
		super.wakeup()
		this.mutationObserver.observe(document.body, {
			childList: true,
			subtree: true
		})
	}

	sleep () {
		super.sleep()
		this.mutationObserver.disconnect()
	}

	observeDOM () {
		this.notifyObservers('watchDOM')
	}
}

class ScrollWatcher extends ObserverSubscriptionManager {
	constructor () {
		super()

		this.debounce = debounce(() => {
			this.watchScroll()
		}, 250, {
			maxWait: 500
		})
	}

	subscribe (observer) {
		super.subscribe(observer)
		observer.watchScroll()
	}

	wakeup () {
		super.wakeup()
		window.addEventListener('scroll', this.debounce, false)
	}

	sleep () {
		super.sleep()
		window.removeEventListener('scroll', this.debounce)
	}

	watchScroll () {
		this.notifyObservers('watchScroll')
	}
}

class ResizeWatcher extends ObserverSubscriptionManager {
	constructor () {
		super()

		this.debounce = debounce(() => {
			this.watchResize()
		}, 250)
	}

	subscribe (observer) {
		super.subscribe(observer)
		observer.watchResize()
	}

	wakeup () {
		super.wakeup()
		window.addEventListener('resize', this.debounce, false)
	}

	sleep () {
		super.sleep()
		window.removeEventListener('resize', this.debounce)
	}

	watchResize () {
		this.notifyObservers('watchResize')
	}
}

class OrientationWatcher extends ObserverSubscriptionManager {
	constructor () {
		super()

		if ('onorientationchange' in window) {
			elementTools.addClass(document.body, 'have-orientation')
		} else {
			elementTools.addClass(document.body, 'no-orientation')
		}

		this.debounce = debounce(() => {
			this.watchOrientation()
		}, 250)
	}

	subscribe (observer) {
		super.subscribe(observer)
		observer.watchOrientation()
	}

	wakeup () {
		super.wakeup()
		if ('onorientationchange' in window) {
			window.addEventListener('orientationchange', this.debounce, false)
		}
	}

	sleep () {
		super.sleep()
		if ('onorientationchange' in window) {
			window.removeEventListener('orientationchange', this.debounce)
		}
	}

	watchOrientation () {
		this.notifyObservers('watchOrientation')
	}
}

// build subscription services
const theDOMWatcher = new DOMWatcher()
const theScrollWatcher = new ScrollWatcher()
const theResizeWatcher = new ResizeWatcher()
const theOrientationWatcher = new OrientationWatcher()

export {
	theDOMWatcher, theScrollWatcher, theResizeWatcher, theOrientationWatcher
}
