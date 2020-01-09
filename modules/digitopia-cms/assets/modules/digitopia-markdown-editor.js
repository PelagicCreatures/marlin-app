import {
	MarkdownView,
	ProseMirrorView
}
	from './prose-mirror.js'

import $ from 'jquery'

import {
	Reagent, registerReagentClass
}
	from '@antisocialnet/reagent'

class markdownEditor extends Reagent {
	constructor (elem, options) {
		super(elem, options)
		this.jqElement = $(elem)

		this.target = $(this.jqElement.data('target'))
		this.content = $(this.jqElement.data('content'))
	}

	start () {
		super.start()
		this.view = new ProseMirrorView(this.target[0], this.content.val())

		this.target.on('input blur focus keyup paste click', '[contenteditable]', (e) => {
			this.content.val(this.view.content).trigger('change')
		})

		this.target.on('input blur focus keyup paste', 'textarea', (e) => {
			this.content.val(this.view.content).trigger('change')
		})

		const self = this
		this.jqElement.on('change', 'input[type=radio]', function (e) {
			const button = this
			if (!button.checked) return
			const View = button.value === 'markdown' ? MarkdownView : ProseMirrorView
			if (self.view instanceof View) return
			const content = self.view.content
			self.view.destroy()
			self.view = new View(self.target[0], content)
			self.view.focus()
		})
	}

	sleep () {
		this.jqElement.off('change', 'input[type=radio]')
		this.view.destroy()
		super.sleep()
	}
}

registerReagentClass('markdownEditor', markdownEditor)

export {
	markdownEditor
}
