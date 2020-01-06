/*
	Responsive Javascript controllers for html elements.

	* @author Michael Rhodes 🐡
	* @license MIT
	* Made in Barbados 🇧🇧, © 2020 by Michael Rhodes (except where noted)

	Attach JS behavior to HTML elements using html attributes so they can
	respond to element events such as:
		scroll
		resize
		orientation
		etc.

	The classic example is lazy loading images or other components but many
	things are possible once DOM elements are coupled with javascript objects.

	Booting this library:
	---------------------
	import {
		boot
	} from './modules/responsive'

	ResponsiveSupervisor watches the DOM for any elements with 'data-responsive-class'
	and instantiates the object, hooking up the appropriate observers. It also destroys
	any dangling objects when the underlying element is removed from the DOM.

	<div data-responsive-class="mySubclass">

	You can also defer the instantiation using the lazy method:

	<div data-lazy-responsive-class="mySubclass">

	Defining SubClasses:
	--------------------
	Your ResponsiveElement subclasses can subscribe to appropriate event feeds and take
	appropriate action.

	class mySubclass extends ResponsiveElement {
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
		enterFullscreen() {} // called if 'watchOrientation: true' and user rotates phone or if setFullscreen is called
		exitFullscreen() {}  // called on exit immersive
	}

	registerClass('mySubclass', mySubclass)

	Don't do any long processes in these callbacks or things might bog down the browser UI.
	To avoid any janky repaints you should only make DOM changes inside animation
	frames - see LazyBackground example below.

*/

import {
	registerClass
}
	from './lib/ResponsiveElement'

import {
	ResponsiveSupervisor
}
	from './lib/ResponsiveSupervisor'

import {
	HijaxLoader
}
	from './lib/HijaxLoader'

import {
	Breakpoints
}
	from './lib/Breakpoints'

let loadPage

const bootResponsive = (options) => {
	const supervisor = new ResponsiveSupervisor(document.body)
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
	registerClass,
	bootResponsive
}
