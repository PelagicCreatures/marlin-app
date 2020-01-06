/**
	ReagentSupervisor

	Watch the document for new content and instantiate class in
	data-responsive-class as needed skipping elements with class
	lazy-instantiate-responsive (those are handled by LazyInstantiate)
**/

import {
	Reagent, registerReagentClass, liveElements, registeredClasses
}
	from './Reagent'

import {
	LazyInstantiate
}
	from './LazyInstantiate'

class ReagentSupervisor extends Reagent {
	constructor (element, options = {}) {
		super(element, {
			watchDOM: true
		})
		this.mortal = false
	}

	start () {
		this.lazy = new LazyInstantiate(this.element)
		this.lazy.start()

		super.start()
	}

	instantiate (element) {
		const cls = element.getAttribute('data-responsive-class').split(/\s*,\s*/)
		for (let i = 0; i < cls.length; i++) {
			const thing = new registeredClasses[cls[i]](element)
			thing.start()
		}

		element.removeAttribute('data-responsive-class')
	}

	DOMChanged () {
		super.DOMChanged()
		const elements = document.querySelectorAll('[data-responsive-class]')
		for (const element of elements) {
			this.instantiate(element)
		}

		// check for dangling live elements and kill them
		const toCleanup = []
		for (let i = 0; i < liveElements.length; i++) {
			if (liveElements[i].mortal && !document.body.contains(liveElements[i].element)) {
				toCleanup.push(liveElements[i])
			}
		}
		for (let i = 0; i < toCleanup.length; i++) {
			toCleanup[i].destroy()
		}
	}
}

registerReagentClass('ReagentSupervisor', ReagentSupervisor)

export {
	ReagentSupervisor
}
