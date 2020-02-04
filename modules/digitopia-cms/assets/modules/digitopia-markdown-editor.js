import {
	MarkdownView,
	ProseMirrorView
}
	from './prose-mirror.js'

class markdownEditor extends Sargasso {
	constructor (elem, options) {
		super(elem, options)

		this.target = this.element.querySelector(this.element.getAttribute('data-target'))
		this.content = this.element.querySelector(this.element.getAttribute('data-content'))
	}

	start () {
		super.start()
		this.view = new ProseMirrorView(this.target, this.content.value)

		elementTools.on(this.target, 'input blur focus keyup paste click', '[contenteditable]', (e) => {
			this.content.value = this.view.content
			this.content.dispatchEvent(new Event('change'))
		})

		elementTools.on(this.target, 'input blur focus keyup paste', 'textarea', (e) => {
			this.content.value = this.view.content
			this.content.dispatchEvent(new Event('change'))
		})

		this.handler = (e) => {
			const button = e.srcElement
			if (!button.checked) return
			const View = button.value === 'markdown' ? MarkdownView : ProseMirrorView
			if (this.view instanceof View) return
			const content = this.view.content
			this.view.destroy()
			this.view = new View(this.target, content)
			this.view.focus()
		}

		Array.from(this.element.querySelectorAll('input[type=radio]')).forEach((el) => {
			el.addEventListener('change', this.handler)
		})
	}

	sleep () {
		Array.from(this.element.querySelectorAll('input[type=radio]')).forEach((el) => {
			el.removeEventListener('change', this.handler)
		})
		this.view.destroy()
		elementTools.on(this.target, 'input blur focus keyup paste click', '[contenteditable]')
		elementTools.off(this.target, 'input blur focus keyup paste', 'textarea')
		super.sleep()
	}
}

registerSargassoClass('markdownEditor', markdownEditor)

export {
	markdownEditor
}
