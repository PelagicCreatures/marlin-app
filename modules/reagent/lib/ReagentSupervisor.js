/**
	ReagentSupervisor

	Reagent class which watches the document for new content and instantiates
	Reagent classes liested in element's data-reagent-class attribute.
	Once instantiated, Reagent objects are trash collected when element is
	removed from the DOM
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
		const cls = element.getAttribute('data-reagent-class').split(/\s*,\s*/)
		for (let i = 0; i < cls.length; i++) {
			try {
				const thing = new registeredClasses[cls[i]](element)
				thing.start()
			} catch (e) {
				console.log('error instantiating ' + cls[i], e, registeredClasses)
			}
		}

		element.removeAttribute('data-reagent-class')
	}

	newPage () {
		this.doIt()
	}

	DOMChanged () {
		this.doIt()
	}

	doIt () {
		const elements = document.querySelectorAll('[data-reagent-class]')
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
