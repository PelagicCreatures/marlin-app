import {
	MarkdownView,
	ProseMirrorView
}
from "./prose-mirror.js"

import $ from "jquery";
import {
	GetJQueryPlugin
}
from '../../modules/digitopia/js/controller.js';

function markdownEditor(elem) {
	this.element = $(elem);
	var self = this;

	this.target = $(this.element.data('target'));
	this.content = $(this.element.data('content'));

	this.start = function () {
		self.view = new MarkdownView(self.target[0], self.content.val())

		this.target.on('input blur focus keyup paste click', '[contenteditable]', function (e) {
			self.content.val(self.view.content)
		})

		this.target.on('input blur focus keyup paste', 'textarea', function (e) {
			self.content.val(self.view.content)
		})

		this.element.on('change', 'input[type=radio]', function (e) {
			let button = this;
			if (!button.checked) return
			let View = button.value == "markdown" ? MarkdownView : ProseMirrorView
			if (self.view instanceof View) return
			let content = self.view.content
			self.view.destroy()
			self.view = new View(self.target[0], content)
			self.view.focus()
		})
	}

	this.stop = function () {
		this.element.off('change', 'input[type=radio]');
	}

}

$.fn.markdownEditor = GetJQueryPlugin('markdownEditor', markdownEditor);

export {
	markdownEditor
}
