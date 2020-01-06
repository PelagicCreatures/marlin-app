/**
	LazyInstantiate

	Watch elements with class lazy-instantiate-responsive and instantiate
	class in data-responsive-class when they scroll into view
**/

import {
	Reagent, registerClass, registeredClasses
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
		const els = document.querySelectorAll('[data-lazy-responsive-class]')
		for (let i = 0; i < els.length; i++) {
			const element = els[i]
			if (elementTools.inViewPort(element)) {
				const cls = element.getAttribute('data-lazy-responsive-class').split(/\s*,\s*/)
				for (let j = 0; j < cls.length; j++) {
					const thing = new registeredClasses[cls[j]](els[i])
					thing.start()
				}
				element.removeAttribute('data-lazy-responsive-class')
			}
		}
	}
}

registerClass('LazyInstantiate', LazyInstantiate)

export {
	LazyInstantiate
}
