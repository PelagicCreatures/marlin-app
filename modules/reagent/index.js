/*
	Reagent

	Simple, Fast, Reactive Javascript controllers for html elements.

	* @author Michael Rhodes 🐡 (except where noted)
	* @license MIT
	* Made in Barbados 🇧🇧, © 2020 by Michael Rhodes

	Sometime HTML element need a nervous system. The classic example is lazy
	loaded images but many things are possible once DOM elements are coupled
	with Reagent classes.

	Booting this library:
	---------------------
	import {
		bootReagent
	} from './modules/reagent'

	let options = {
		hijax: {
			onError: (level, message) => {},
			onLoading: function () {},
			onExitPage: () => {},
			onEnterPage: () => {}
		}
	}
	bootReagent(options)

	ReagentSupervisor watches the DOM for any elements with 'data-responsive-class'
	and instantiates the object, hooking up the appropriate observers. It also destroys
	any dangling objects when the underlying element is removed from the DOM.

	<div data-responsive-class="mySubclass"></div>

	You can also defer the instantiation using the lazy method:

	<div data-lazy-responsive-class="mySubclass"></div>

	Defining SubClasses:
	--------------------
	Your Reagent subclasses can subscribe to event feeds to be notified of events.

	class mySubclass extends Reagent {
		constructor(element,options) {
			super(element, {
				watchDOM: [true:false],
				watchScroll: [true:false],
				watchResize: [true:false],
				watchOrientation: [true:false],
				watchViewport: [true:false]
			})
		}

		// Methods that will be called when various events occur. Do what you need to do.

		DOMChanged() {}      // called if 'watchDOM: true' when DOM changes
		didScroll() {}       // called if 'watchScroll: true' when scroll occurs
		didResize() {}       // called if 'watchResize: true' when resize changes
		enterViewport() {}   // called if 'watchViewport: true' when element is entering viewport
		exitViewport() {}    // called if 'watchViewport: true' when element is exiting viewport
		enterFullscreen() {} // called if 'watchOrientation: true' when user rotates phone or if setFullscreen is called
		exitFullscreen() {}  // called on exit fullscreen
		newPage(old,new)     // on a new page
		didBreakpoint()      // new screen width breakpoint
	}

	registerReagentClass('mySubclass', mySubclass)

	Don't do any long processes in these callbacks or things might bog down the browser UI.
	To avoid any chaotic repaints you should only make DOM changes inside animation
	frames - see LazyBackground example below.

	class mySubclass extends Reagent {
		constructor(element,options = {}) {
			options.watchViewport = true
			super(element,options)
		}

		enterViewport() {
			// do some stuff such as modify element html or classes
			let frame = () => {
				this.element.innerHTML = '<p>Hello viewport!'
			}
			this.queueFrame(frame)
		}
	}
*/

import {
	registerReagentClass
}
	from './lib/Reagent'

import {
	ReagentSupervisor
}
	from './lib/ReagentSupervisor'

import {
	HijaxLoader
}
	from './lib/HijaxLoader'

import {
	Breakpoints
}
	from './lib/Breakpoints'

let loadPage

const bootReagent = (options) => {
	const supervisor = new ReagentSupervisor(document.body)
	supervisor.start()
	if (options.breakpoints) {
		const breakpoints = new Breakpoints(document.body, options.breakpoints)
		breakpoints.start()
	}
	if (options.hijax) {
		const hijax = new HijaxLoader(document.body, options.hijax)
		hijax.start()
		loadPage = hijax.setPage.bind(hijax)
	} else {
		loadPage = (url) => {
			document.location.href = loadPage
		}
	}

	return loadPage
}

export {
	registerReagentClass,
	bootReagent
}
