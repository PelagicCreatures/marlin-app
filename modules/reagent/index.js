/*
	Reagent

	Simple, Fast, Reactive, supervised Javascript controllers for html elements.

	* @author Michael Rhodes (except where noted)
	* @license MIT
	* Made in Barbados 🇧🇧

	Sometimes HTML elements need a nervous system - many things are possible
	once DOM elements are coupled with Reagent classes – Lazy Loading,
	size appropriate images and content, parallax scrolling effects, form
	validators, API endpoint controllers to name a few.

	This framework implements a sophisticated HIJAX page loading scheme
	which supports deep linking and lighning fast page loads where only
	only content areas are updated between pages leaving css, js and wrapper
	elementes intact.

	Performance is optimized with shared event listeners which are fully
	debounced during large updates and services are provided to schedule
	content changes using the browser's animation frame event loop resulting
	in smooth page updates.

	This framework uses the advanced features of modern browsers to maximum effect.

	Using these classes:
	-------------------
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

	ReagentSupervisor watches the DOM for any elements with 'data-reagent-class'
	and instantiates the object, hooking up the appropriate observers. It also destroys
	any dangling objects when the underlying element is removed from the DOM.

	<div data-reagent-class="mySubclass"></div>

	You can also defer the instantiation using the lazy method:

	<div data-lazy-reagent-class="mySubclass"></div>

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

	---

	Copyright 2020 Michael Rhodes

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is furnished
	to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
	FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
	COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
	IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	---
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
