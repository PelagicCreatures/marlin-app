/**
	LazyInstantiate

	Reagent class watches the document for new content and instantiates
	Reagent classes liested in element's data-lazy-reagent-class only when
	the element scrolls into view
**/

import {
	Reagent, registerReagentClass, registeredClasses
}
	from './Reagent'

import {
	elementTools
}
	from './utils'

class LazyInstantiate extends Reagent {
	constructor (element, options = {}) {
		super(element, {
			watchScroll: true,
			watchResize: true
		})
		this.mortal = false
	}

	didResize () {
		super.didResize()
		this.lazyHandler()
	}

	didScroll () {
		super.didScroll()
		this.lazyHandler()
	}

	// watch viewport and instantiate lazy-instantiate-responsive things when visible
	lazyHandler () {
		const els = document.querySelectorAll('[data-lazy-reagent-class]')
		for (let i = 0; i < els.length; i++) {
			const element = els[i]
			if (elementTools.inViewPort(element)) {
				const cls = element.getAttribute('data-lazy-reagent-class').split(/\s*,\s*/)
				for (let j = 0; j < cls.length; j++) {
					const thing = new registeredClasses[cls[j]](els[i])
					thing.start()
				}
				element.removeAttribute('data-lazy-reagent-class')
			}
		}
	}
}

registerReagentClass('LazyInstantiate', LazyInstantiate)

export {
	LazyInstantiate
}
